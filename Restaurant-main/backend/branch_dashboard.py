from fastapi import APIRouter
from database import db
from datetime import datetime, timedelta
from collections import defaultdict


def calculate_growth(branch_id: str):
    today = datetime.now().date()
    current_start = today - timedelta(days=7)
    previous_start = today - timedelta(days=14)
    current_sales = 0.0
    previous_sales = 0.0

    orders = db["orders"].find({
        "$or": [
            {"branchId": branch_id},
            {"branchId": str(branch_id)},
            {"branch_id": branch_id},
            {"branch_id": str(branch_id)},
        ]
    })

    for order in orders:
        if order.get("status") != "confirmed":
            continue

        order_date = order.get("order_date")
        if order_date:
            try:
                order_date = datetime.strptime(str(order_date), "%Y-%m-%d").date()
            except ValueError:
                continue
        else:
            order_date = order.get("confirmedAt") or order.get("createdAt") or order.get("created_at")
            if isinstance(order_date, datetime):
                order_date = order_date.date()
            else:
                continue

        amount = float(order.get("total_amount", order.get("total", 0)) or 0)
        if current_start <= order_date <= today:
            current_sales += amount
        elif previous_start <= order_date < current_start:
            previous_sales += amount

    if previous_sales == 0:
        return 100 if current_sales > 0 else 0
    return round(((current_sales - previous_sales) / previous_sales) * 100, 2)

router = APIRouter()



# =====================================================
# BRANCH DASHBOARD
@router.get("/api/branch/dashboard/{branch_id}")
def branch_dashboard(branch_id:str):


    # ===============================
    # ALL CONFIRMED ORDERS
    # ===============================


    all_orders = list(

        db["orders"].find({

            "branchId": branch_id,

            "status":"confirmed"

        })

    )




    # ===============================
    # TODAY
    # ===============================


    today_start = datetime.now().replace(

        hour=0,

        minute=0,

        second=0,

        microsecond=0

    )



    today_orders = []



    for order in all_orders:


        confirmed = order.get(
            "confirmedAt"
        )


        if confirmed and confirmed >= today_start:

            today_orders.append(order)






    # ===============================
    # TOTAL SALES
    # ===============================


    total_revenue = 0


    for order in all_orders:


        total_revenue += float(

            order.get(
                "total",
                0
            )

        )





    today_revenue = 0



    for order in today_orders:


        today_revenue += float(

            order.get(
                "total",
                0
            )

        )







    # ===============================
    # ITEMS SOLD
    # ===============================


    items_sold = 0



    for order in all_orders:


        for item in order.get(
            "items",
            []
        ):


            items_sold += item.get(
                "quantity",
                1
            )



    # ===============================
    # WEEKLY GRAPH
    # ===============================


    sales_map = defaultdict(float)



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





    for order in all_orders:


        confirmed = order.get(
            "confirmedAt"
        )


        if confirmed and confirmed >= week_start:


            day = confirmed.strftime(
                "%a"
            )


            sales_map[day] += float(

                order.get(
                    "total",
                    0
                )

            )



    weekly_sales = []



    days = [

        "Mon",
        "Tue",

        "Wed",

        "Thu",

        "Fri",

        "Sat",

        "Sun"

    ]



    for day in days:


        weekly_sales.append({

            "day":
            day,


            "sales":
            sales_map[day]

        })







    # ===============================
    # RECENT INVENTORY USAGE
    # ===============================


    inventory_logs = list(

        db["inventory_transactions"].find({

            "branchId": branch_id,

            "type":"sale"

        })

        .sort(

            "createdAt",

            -1

        )

        .limit(10)

    )




    inventory_usage = []



    for log in inventory_logs:


        inventory_usage.append({


            "ingredient":

            log.get(

                "IngredientName",

                "Unknown"

            ),



            "used":

            log.get(

                "quantityUsed",

                0

            ),



            "unit":

            log.get(

                "unit",

                ""

            ),



            "beforeStock":

            log.get(

                "beforeStock",

                0

            ),



            "remaining":

            log.get(

                "afterStock",

                0

            ),



            "orderId":

            log.get(

                "orderId",

                ""

            ),



            "date":

            str(

                log.get(

                    "createdAt"

                )

            )


        })








    # ===============================
    # RESPONSE
    # ===============================


    return {


        "orders":

        len(today_orders),



        "totalOrders":

        len(all_orders),



        "revenue":

        today_revenue,



        "totalRevenue":

        total_revenue,



        "customers":

        len(today_orders),



        "itemsSold":

        items_sold,



        "growth":

        calculate_growth(branch_id),



        "weekly_sales":

        weekly_sales,



        "inventory_usage":

        inventory_usage


    }
# =====================================================
# INVENTORY USAGE HISTORY
# =====================================================

@router.get("/api/dashboard/inventory-usage/{branch_id}")
def inventory_usage(branch_id:str):


    logs = list(

        db["inventory_transactions"].find({

            "branchId": branch_id,

            "type":"sale"

        })

        .sort(
            "createdAt",
            -1
        )

        .limit(20)

    )



    result = []



    for log in logs:


        result.append({


            "ingredient":

            log.get(
                "IngredientName",
                "Unknown"
            ),



            "used":

            log.get(
                "quantityUsed",
                0
            ),



            "unit":

            log.get(
                "unit",
                "unit"
            ),



            "beforeStock":

            log.get(
                "beforeStock",
                0
            ),



            "remaining":

            log.get(
                "afterStock",
                0
            ),



            "orderId":

            log.get(
                "orderId",
                ""
            ),



            "date":

            str(
                log.get(
                    "createdAt"
                )
            )


        })



    return {


        "success":True,


        "data":result

    }