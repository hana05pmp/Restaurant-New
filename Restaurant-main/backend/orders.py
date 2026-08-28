from fastapi import APIRouter
from database import db
from datetime import datetime
from bson import ObjectId


router = APIRouter()



# =====================================================
# UNIT CONVERSION
# =====================================================

def convert_unit(value, from_unit, to_unit):

    if not from_unit or not to_unit:
        return value


    from_unit = str(from_unit).lower()
    to_unit = str(to_unit).lower()


    if from_unit == to_unit:
        return value



    conversions = {

        ("kg","g"):1000,
        ("g","kg"):0.001,

        ("l","ml"):1000,
        ("liter","ml"):1000,
        ("ml","l"):0.001,
        ("ml","liter"):0.001,

        ("mg","g"):0.001,
        ("g","mg"):1000,

        ("oz","g"):28.3495,
        ("g","oz"):0.035274,

        ("ounce","gram"):28.3495,
        ("gram","ounce"):0.035274

    }


    factor = conversions.get(
        (
            from_unit,
            to_unit
        )
    )


    if factor:
        return value * factor


    return value







# =====================================================
# CREATE ORDER
# =====================================================

@router.post("/api/orders")
def create_order(order:dict):


    items=[]


    for item in order.get("items",[]):


        menu=None


        dish_id=item.get("dishId")



        if dish_id:


            try:

                menu=db["menu_items"].find_one({
                    "$or": [
                        {"menu_id": dish_id},
                        {"MenuItemId": int(dish_id) if str(dish_id).isdigit() else -1},
                    ]
                })

            except:

                pass




        if not menu:


            menu=db["menu_items"].find_one({

                "Description":
                item.get("name")

            })




        if menu:


            item["recipeId"]=menu.get(
                "RecipeId"
            )


            item["menuItemId"]=menu.get(
                "MenuItemId"
            )


            item["image"]=menu.get(
                "Image",
                "/menu/default.png"
            )



        items.append(item)





    order_data={


        "branchId": order.get("branchId"),


        "createdBy":
        order.get(
            "createdBy",
            "customer"
        ),


        "items":
        items,


        "total":
        order.get(
            "total",
            0
        ),


        "status":
        "pending",


        "createdAt":
        datetime.now()

    }



    result=db["orders"].insert_one(
        order_data
    )



    return {


        "success":True,


        "orderId":
        str(result.inserted_id)

    }








# =====================================================
# GET ALL ORDERS
# =====================================================

@router.get("/api/orders/all")
def get_all_orders():
    orders = list(db["orders"].find({}).sort("createdAt", -1))

    for order in orders:
        order["_id"] = str(order["_id"])

    return orders

# =====================================================
# GET ORDERS
# =====================================================

@router.get("/api/orders/{branch_id}")
def get_orders(branch_id:str):


    orders=list(

        db["orders"].find({

            "$or":[

                {"branchId": branch_id},
                {"branch_id": branch_id},

            ]

        }).sort("createdAt", -1)

    )



    for order in orders:

        order["_id"]=str(
            order["_id"]
        )


    return orders

# =====================================================
# CONFIRM ORDER
# =====================================================

@router.put("/api/orders/{order_id}/confirm")
def confirm_order(order_id:str):


    try:

        order=db["orders"].find_one({

            "_id":
            ObjectId(order_id)

        })


    except:

        return {

            "success":False,

            "message":"Invalid order id"

        }




    if not order:


        return {

            "success":False,

            "message":"Order not found"

        }




    if order.get("status")=="confirmed":


        return {

            "success":False,

            "message":"Already confirmed"

        }





    branch_id=order.get(
        "branchId"
    )


    stock_updates=[]





    # =====================================================
    # STOCK DEDUCTION (ONLY THIS BRANCH)
    # =====================================================


    for item in order.get("items",[]):


        recipe_id=item.get(
            "recipeId"
        )



        # fallback recipe search

        if not recipe_id:


            menu=db["menu_items"].find_one({

                "Description":
                item.get("name")

            })


            if menu:

                recipe_id=menu.get(
                    "RecipeId"
                )



        if not recipe_id:

            continue





        recipes=list(

            db["recipe_ingredient_assignments"].find({

                "$or":[

                    {
                        "RecipeId":recipe_id
                    },

                    {
                        "RecipeId":str(recipe_id)
                    },

                    {
                        "RecipeId":int(recipe_id)
                    }

                ]

            })

        )






        quantity_ordered=int(

            item.get(
                "quantity",
                1
            )

        )





        for recipe in recipes:



            ingredient_id=recipe.get(
                "IngredientId"
            )




            recipe_qty=float(

                recipe.get(
                    "Quantity",
                    0
                )

            )



            recipe_unit=recipe.get(
                "Unit",
                ""
            )





            # GET ONLY CURRENT BRANCH STOCK

            inventory=db["branch_inventory"].find_one({

                "$and":[

                    {

                    "$or":[

                        {
                            "branchId":branch_id
                        },

                        {
                            "branchId":str(branch_id)
                        }

                    ]

                    },


                    {

                    "$or":[

                        {
                        "IngredientId":ingredient_id
                        },


                        {
                        "IngredientId":str(ingredient_id)
                        }

                    ]

                    }

                ]

            })





            if not inventory:

                continue





            stock_unit=inventory.get(
                "Unit",
                ""
            )




            used = convert_unit(

                recipe_qty,

                recipe_unit,

                stock_unit

            )



            used = used * quantity_ordered





            before=float(

                inventory.get(
                    "Stock",
                    0
                )

            )




            if before < used:

                continue





            remaining = before - used






            # UPDATE ONLY THIS BRANCH


            db["branch_inventory"].update_one(


                {


                "_id":
                inventory["_id"]


                },


                {


                "$set":{


                    "Stock":
                    remaining


                }


                }


            )







            # SAVE TRANSACTION


            db["inventory_transactions"].insert_one({


                "orderId":
                order_id,


                "branchId":
                branch_id,


                "IngredientId":
                ingredient_id,


                "IngredientName":
                inventory.get(
                    "IngredientName",
                    "Unknown"
                ),


                "beforeStock":
                before,


                "used":
                used,


                "unit":
                stock_unit,


                "remaining":
                remaining,


                "createdAt":
                datetime.now()

            })






            stock_updates.append({


                "IngredientName":
                inventory.get(
                    "IngredientName"
                ),


                "Used":
                used,


                "Unit":
                stock_unit,


                "Remaining":
                remaining


            })









    # =====================================================
    # SAVE SALES DETAILS
    # =====================================================


    for item in order.get("items",[]):


        qty=item.get(
            "quantity",
            1
        )


        price=item.get(
            "price",
            0
        )



        db["order_details"].insert_one({


            "StoreNumber":
            branch_id,


            "OrderId":
            order_id,


            "Description":
            item.get(
                "name",
                "Unknown"
            ),


            "Quantity":
            qty,


            "Price":
            price,


            "Total":
            qty * price,


            "date":
            datetime.now().strftime(
                "%Y-%m-%d"
            )


        })









    # =====================================================
    # CHANGE ORDER STATUS
    # =====================================================


    db["orders"].update_one({


        "_id":
        ObjectId(order_id)


    },


    {


        "$set":{


            "status":
            "confirmed",


            "confirmedAt":
            datetime.now()


        }


    })





    return {


        "success":True,


        "message":
        "Order confirmed successfully",


        "stockUpdated":
        stock_updates

    }