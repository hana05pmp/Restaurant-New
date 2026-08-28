from fastapi import APIRouter
from database import db
from datetime import datetime, timedelta
from collections import defaultdict


router = APIRouter()


@router.get("/api/branch/sales-report/{branch_id}")
def sales_report(branch_id: str):


    # =====================================
    # INITIAL VALUES
    # =====================================


    old_orders = 0
    old_sales = 0


    new_orders = 0
    new_sales = 0
    new_items = 0


    today_sales = 0


    top_menu = defaultdict(int)


    weekly = defaultdict(float)



    today_start = datetime.now().replace(

        hour=0,
        minute=0,
        second=0,
        microsecond=0

    )


    week_start = (

        datetime.now()

        -

        timedelta(days=6)

    ).replace(

        hour=0,
        minute=0,
        second=0,
        microsecond=0

    )





    # =====================================
    # AVERAGE MENU PRICE
    # menuitem collection
    # =====================================


    total_menu_price = 0

    menu_count = 0



    menus = db["menuitem"].find({})



    for menu in menus:


        price = float(

            menu.get(

                "Price",

                0

            )

        )


        if price > 0:


            total_menu_price += price

            menu_count += 1





    average_menu_price = (

        total_menu_price / menu_count

        if menu_count > 0

        else 4

    )






    # =====================================
    # OLD DATASET
    # order_details
    # =====================================


    old_data = list(

        db["order_details"].find({

            "$or":[

                {

                    "StoreNumber": str(branch_id)

                },

                {

                    "StoreNumber": int(branch_id) if branch_id.isdigit() else -1

                }

            ]

        })

    )




    # old dataset only contains order count

    old_orders = len(old_data)




    # estimated sales

    old_sales = (

        old_orders * average_menu_price

    )







    # =====================================
    # NEW DATASET
    # orders
    # =====================================


    orders = db["orders"].find({


        "$or":[

            {

                "branchId": branch_id

            },

            {

                "branch_id": branch_id

            }

        ],


        "status":"confirmed"


    })







    for order in orders:


        new_orders += 1


        order_total = 0



        for item in order.get(

            "items",

            []

        ):



            qty = int(

                item.get(

                    "quantity",

                    0

                )

            )



            price = float(

                item.get(

                    "price",

                    0

                )

            )



            item_sales = (

                qty * price

            )



            order_total += item_sales



            new_items += qty




            name = item.get(

                "name",

                "Unknown"

            )



            top_menu[name] += qty






        new_sales += order_total





        confirmed = order.get(

            "confirmedAt"

        )




        if confirmed:



            if confirmed >= today_start:


                today_sales += order_total




            if confirmed >= week_start:



                day = confirmed.strftime(

                    "%a"

                )


                weekly[day] += order_total







    # =====================================
    # FINAL RESULT
    # =====================================


    total_sales = (

        old_sales

        +

        new_sales

    )



    total_orders = (

        old_orders

        +

        new_orders

    )



    average_order = (

        total_sales / total_orders

        if total_orders > 0

        else 0

    )






    # =====================================
    # WEEKLY SALES FORMAT
    # =====================================


    weekly_sales = []



    for day in [

        "Mon",

        "Tue",

        "Wed",

        "Thu",

        "Fri",

        "Sat",

        "Sun"

    ]:


        weekly_sales.append({

            "day": day,

            "sales": round(

                weekly[day],

                2

            )

        })






    # =====================================
    # TOP MENU
    # =====================================


    top_menus = []



    for name, qty in sorted(

        top_menu.items(),

        key=lambda x:x[1],

        reverse=True

    )[:10]:


        top_menus.append({

            "name": name,

            "quantity": qty

        })







    return {


        "branchId": branch_id,


        "averageMenuPrice": round(

            average_menu_price,

            2

        ),


        "todaySales": round(

            today_sales,

            2

        ),


        "totalSales": round(

            total_sales,

            2

        ),


        "totalOrders": total_orders,


        "itemsSold": new_items,


        "averageOrderValue": round(

            average_order,

            2

        ),


        "weeklySales": weekly_sales,


        "topMenus": top_menus

    }