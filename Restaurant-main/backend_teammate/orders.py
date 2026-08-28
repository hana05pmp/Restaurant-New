from fastapi import APIRouter
from database import db
from datetime import datetime
from bson import ObjectId


router = APIRouter()



# =====================================================
# CREATE ORDER
# =====================================================

# =====================================================
# CREATE ORDER
# =====================================================

@router.post("/api/orders")
def create_order(order: dict):


    branch_id = order.get("branch_id")

    items = order.get(
        "items",
        []
    )


    order_items = []

    total_amount = 0



    # ===============================
    # GET MENU DATA
    # ===============================

    for item in items:

        menu_id = item.get(
            "menu_id"
        )

        quantity = int(
            item.get(
                "quantity",
                1
            )
        )

        menu = db["menu_items"].find_one(

            {
                "menu_id":
                menu_id
            }

        )

        if not menu:
            continue

        price = float(
            menu.get(
                "price",
                0
            )
        )

        cost_price = float(
            menu.get(
                "cost_price",
                0
            )
        )

        subtotal = price * quantity

        total_amount += subtotal

        order_items.append({

            "menu_id":
            menu_id,

            "menu_name":
            menu.get(
                "menu_name"
            ),

            "quantity":
            quantity,

            "unit_price":
            price,

            "cost_price":
            cost_price,

            "image":
            menu.get(
                "image",
                ""
            ),

            "subtotal":
            subtotal

        })

    # ===============================
    # CREATE ORDER HEADER
    # ===============================

    order_result = db["orders"].insert_one({

        "branch_id":
        branch_id,

        "total_amount":
        round(
            total_amount,
            2
        ),

        "status":
        "pending",

        "order_date":
        datetime.now().strftime(
            "%Y-%m-%d"
        ),

        "created_at":
        datetime.now()

    })

    order_id = str(
        order_result.inserted_id
    )

    # ===============================
    # CREATE ORDER ITEMS
    # ===============================

    for item in order_items:

        db["order_items"].insert_one({

            "order_item_id":
            "OI" + order_id[-6:],

            "order_id":
            order_id,

            "menu_id":
            item["menu_id"],

            "quantity":
            item["quantity"],

            "unit_price":
            item["unit_price"],

            "subtotal":
            item["subtotal"]

        })

    return {


        "success":
        True,


        "order_id":
        order_id,


        "total_amount":
        total_amount

    }


# =====================================================
# GET ORDERS BY BRANCH
# =====================================================

@router.get("/api/orders/{branch_id}")
def get_orders(branch_id:str):


    orders=list(
        db["orders"]
        .find(
            {
                "branch_id":branch_id
            }
        )
        .sort(
            "created_at",
            -1
        )
    )


    result=[]


    for order in orders:


        order_id = order.get(
            "order_id"
        )


        items=[]


        order_items=list(

            db["order_items"].find(

                {
                    "order_id":order_id
                },

                {
                    "_id":0
                }

            )

        )



        for item in order_items:


            menu=db["menu_items"].find_one(

                {
                    "menu_id":
                    item.get("menu_id")
                },

                {
                    "_id":0
                }

            )



            items.append({

                "menu_id":
                item.get("menu_id"),


                "menu_name":
                menu.get("menu_name")
                if menu
                else "Unknown Menu",


                "image":
                menu.get("image","")
                if menu
                else "",


                "quantity":
                item.get("quantity",1),


                "unit_price":
                item.get("unit_price",0)

            })




        result.append({

            "id":
            str(order["_id"]),


            "order_id":
            order_id,


            "branch_id":
            order.get("branch_id"),


            "items":
            items,


            "total_amount":
            order.get(
                "total_amount",
                0
            ),


            "status":
            order.get(
                "status",
                "pending"
            )

        })


    return result

# =====================================================
# CONFIRM ORDER
# =====================================================


@router.put("/api/orders/{order_id}/confirm")
def confirm_order(order_id:str):


    try:

        order = db["orders"].find_one(

            {
                "_id":
                ObjectId(order_id)
            }

        )


    except:


        return {


            "success":
            False,


            "message":
            "Invalid order id"

        }





    if not order:


        return {


            "success":
            False,


            "message":
            "Order not found"

        }





    if order.get("status")=="confirmed":


        return {


            "success":
            False,


            "message":
            "Already confirmed"

        }





    branch_id = order.get(
        "branch_id"
    )



    total_cost=0

    stock_updates=[]






    # CHECK STOCK

    for item in order.get(
        "items",
        []
    ):



        menu_id=item.get(
            "menu_id"
        )



        quantity=int(
            item.get(
                "quantity",
                1
            )
        )



        ingredients=list(

            db["menu_ingredients"].find(

                {
                    "menu_id":
                    menu_id
                }

            )

        )



        for ing in ingredients:



            ingredient_id=ing.get(
                "ingredient_id"
            )



            required=(

                float(
                    ing.get(
                        "quantity_required",
                        0
                    )
                )

                *
                quantity

            )



            inventory=db["branch_inventory"].find_one(

                {

                "branch_id":
                branch_id,


                "ingredient_id":
                ingredient_id

                }

            )



            if inventory:


                current=float(

                    inventory.get(
                        "stock_quantity",
                        0
                    )

                )


                if current < required:


                    return {


                        "success":
                        False,


                        "message":
                        f"Not enough stock {ingredient_id}"

                    }







    # DEDUCT STOCK


    for item in order.get(
        "items",
        []
    ):



        menu_id=item.get(
            "menu_id"
        )


        quantity=int(
            item.get(
                "quantity",
                1
            )
        )



        total_cost += (

            float(
                item.get(
                    "cost_price",
                    0
                )
            )

            *
            quantity

        )




        ingredients=list(

            db["menu_ingredients"].find(

                {
                    "menu_id":
                    menu_id
                }

            )

        )



        for ing in ingredients:


            ingredient_id=ing.get(
                "ingredient_id"
            )


            required=(

                float(
                    ing.get(
                        "quantity_required",
                        0
                    )
                )

                *
                quantity

            )



            inventory=db["branch_inventory"].find_one(

                {

                "branch_id":
                branch_id,


                "ingredient_id":
                ingredient_id

                }

            )



            if inventory:


                remaining=(

                    float(
                        inventory.get(
                            "stock_quantity",
                            0
                        )
                    )

                    -
                    required

                )



                db["branch_inventory"].update_one(

                    {
                        "_id":
                        inventory["_id"]
                    },


                    {
                        "$set":
                        {
                            "stock_quantity":
                            remaining
                        }
                    }

                )



                stock_updates.append({

                    "ingredient_id":
                    ingredient_id,


                    "used":
                    required,


                    "remaining":
                    remaining

                })







    profit=(

        float(
            order.get(
                "total_amount",
                0
            )
        )

        -
        total_cost

    )






    db["orders"].update_one(

        {

        "_id":
        ObjectId(order_id)

        },


        {

        "$set":

        {

        "status":
        "confirmed",


        "confirmed_at":
        datetime.now(),


        "ingredient_cost":
        round(
            total_cost,
            2
        ),


        "profit":
        round(
            profit,
            2
        )

        }

        }

    )





    return {


        "success":
        True,


        "message":
        "Order confirmed successfully",


        "profit":
        round(
            profit,
            2
        ),


        "stock_updated":
        stock_updates

    }







# =====================================================
# ALL ORDERS
# =====================================================


@router.get("/api/orders/all")
def get_all_orders():


    orders=list(

        db["orders"]
        .find({})
        .sort(
            "created_at",
            -1
        )

    )


    for order in orders:

        order["_id"]=str(
            order["_id"]
        )



    return orders