from fastapi import APIRouter
from database import db
from datetime import datetime, timedelta
from collections import defaultdict


router = APIRouter()



@router.get("/api/branch/sales-report/{branch_id}")
def sales_report(branch_id:str):


    total_orders = 0
    total_sales = 0
    today_sales = 0
    items_sold = 0


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
    # Average Menu Price
    # =====================================

    prices=[]


    for menu in db["menu_items"].find({}):

        price=float(
            menu.get(
                "price",
                0
            )
        )

        if price>0:
            prices.append(price)



    average_menu_price = (

        sum(prices)/len(prices)

        if prices

        else 0

    )



    # =====================================
    # Orders
    # =====================================


    orders=db["orders"].find({

        "branch_id":
        branch_id

    })



    for order in orders:


        total_orders +=1


        amount=float(

            order.get(
                "total_amount",
                0
            )

        )


        total_sales += amount



        confirmed = order.get(
            "confirmed_at"
        )


        if confirmed:


            if confirmed >= today_start:

                today_sales += amount



            if confirmed >= week_start:


                day=confirmed.strftime(
                    "%a"
                )


                weekly[day]+=amount




        # Menu quantity

        for item in order.get(
            "items",
            []
        ):


            qty=int(
                item.get(
                    "quantity",
                    0
                )
            )


            items_sold += qty



            name=item.get(
                "menu_name",
                "Unknown"
            )


            top_menu[name]+=qty





    average_order_value=(

        total_sales / total_orders

        if total_orders>0

        else 0

    )





    weekly_sales=[]


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

            "day":
            day,

            "sales":
            round(
                weekly[day],
                2
            )

        })





    top_menus=[]


    for name,qty in sorted(

        top_menu.items(),

        key=lambda x:x[1],

        reverse=True

    )[:10]:


        top_menus.append({

            "name":
            name,

            "quantity":
            qty

        })




    return {


        "branchId":
        branch_id,


        "averageMenuPrice":
        round(
            average_menu_price,
            2
        ),


        "todaySales":
        round(
            today_sales,
            2
        ),


        "totalSales":
        round(
            total_sales,
            2
        ),


        "totalOrders":
        total_orders,


        "itemsSold":
        items_sold,


        "averageOrderValue":
        round(
            average_order_value,
            2
        ),


        "weeklySales":
        weekly_sales,


        "topMenus":
        top_menus

    }