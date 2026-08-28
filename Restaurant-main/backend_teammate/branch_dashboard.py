from fastapi import APIRouter
from database import db
from datetime import datetime, timedelta
from collections import defaultdict


router = APIRouter()



# =====================================================
# CALCULATE GROWTH
# =====================================================

def calculate_growth(branch_id:str):


    today = datetime.now().date()


    current_start = today - timedelta(days=7)

    previous_start = today - timedelta(days=14)



    current_sales = 0

    previous_sales = 0




    orders = list(
        db["orders"].find({

            "branch_id":
            branch_id

        })
    )




    for order in orders:



        if order.get("status") != "confirmed":

            continue




        try:


            order_date = datetime.strptime(

                order.get(
                    "order_date"
                ),

                "%Y-%m-%d"

            ).date()




            sales = float(

                order.get(
                    "total_amount",
                    0
                )

            )




            if order_date >= current_start:


                current_sales += sales




            elif order_date >= previous_start:


                previous_sales += sales




        except:

            pass





    if previous_sales == 0:

        return 0





    growth = (

        (current_sales - previous_sales)

        /

        previous_sales

    ) * 100




    return round(
        growth,
        2
    )







# =====================================================
# BRANCH DASHBOARD
# =====================================================


@router.get("/api/branch/dashboard/{branch_id}")
def branch_dashboard(branch_id:str):



    # ==============================
    # BRANCH INFO
    # ==============================


    branch = db["branches"].find_one({

        "branch_id":
        branch_id

    })




    branch_name = (

        branch.get(
            "branch_name",
            "UNKNOWN"
        )

        if branch

        else

        "UNKNOWN"

    )



    city = (

        branch.get(
            "city",
            "-"
        )

        if branch

        else

        "-"

    )







    # ==============================
    # ORDERS
    # ==============================



    orders = list(

        db["orders"].find({

            "branch_id":
            branch_id

        })

    )





    completed_orders = []




    for order in orders:


        if order.get(
            "status"
        ) == "confirmed":


            completed_orders.append(order)









    # ==============================
    # SALES PROFIT
    # ==============================


    total_sales = 0

    ingredient_cost = 0

    gross_profit = 0





    for order in completed_orders:



        total_sales += float(

            order.get(
                "total_amount",
                0
            )

        )




        ingredient_cost += float(

            order.get(
                "ingredient_cost",
                0
            )

        )




        gross_profit += float(

            order.get(
                "profit",
                0
            )

        )









    # ==============================
    # ITEMS SOLD + TOP MENU
    # ==============================


    items_sold = 0


    menu_sales = defaultdict(int)





    for order in completed_orders:



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




            items_sold += qty




            menu_sales[

                item.get(

                    "menu_name",

                    "Unknown"

                )

            ] += qty







    top_menu = []




    for name,qty in sorted(

        menu_sales.items(),

        key=lambda x:x[1],

        reverse=True

    )[:10]:


        top_menu.append({

            "name":
            name,


            "quantity":
            qty

        })









    # ==============================
    # WEEKLY SALES
    # ==============================


    weekly_map = defaultdict(float)





    for order in completed_orders:



        try:


            date = datetime.strptime(

                order.get(
                    "order_date"
                ),

                "%Y-%m-%d"

            )



            day = date.strftime(
                "%a"
            )



            weekly_map[day] += float(

                order.get(
                    "total_amount",
                    0
                )

            )



        except:

            pass







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

                weekly_map[day],

                2

            )

        })










    # ==============================
    # GROWTH
    # ==============================


    growth = calculate_growth(

        branch_id

    )








    return {


        "branchId":
        branch_id,



        "branchName":
        branch_name,



        "city":
        city,



        "orders":
        len(completed_orders),



        "totalOrders":
        len(completed_orders),



        "totalSales":
        round(
            total_sales,
            2
        ),



        "ingredientCost":
        round(
            ingredient_cost,
            2
        ),



        "grossProfit":
        round(
            gross_profit,
            2
        ),



        "revenue":
        round(
            total_sales,
            2
        ),



        "customers":
        len(completed_orders),



        "itemsSold":
        items_sold,



        "growth":
        growth,



        "weekly_sales":
        weekly_sales,



        "topMenus":
        top_menu

    }







# =====================================================
# INVENTORY USAGE
# =====================================================


@router.get("/api/dashboard/inventory-usage/{branch_id}")
def inventory_usage(branch_id:str):


    inventory = list(

        db["branch_inventory"].find({

            "branch_id":
            branch_id

        },

        {

            "_id":0

        })

    )



    return {


        "success":
        True,


        "data":
        inventory

    }