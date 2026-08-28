from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from collections import defaultdict
from pydantic import BaseModel
from database import client, db
from orders import router as order_router
from menu import router as menu_router
from branch_dashboard import router as branch_dashboard_router
from branch_inventory import router as branch_inventory_router
from sales_report import router as sales_report_router
from fastapi.responses import Response

app = FastAPI(
    title="Taste & Treasure Restaurant API",
    version="1.0.0"
)
app.include_router(menu_router)
@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)
    
# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(branch_dashboard_router)

app.include_router(order_router)

app.include_router(branch_inventory_router)

app.include_router(sales_report_router)



# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
        "Taste & Treasure API is running"
    }



# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    try:

        client.admin.command("ping")


        return {
            "status":"ok",
            "mongodb":"connected",
            "database":"restaurant_db"
        }


    except Exception as e:

        return {
            "status":"error",
            "error":str(e)
        }



# ============================================================
# MENU API
# ============================================================

@app.get("/api/menu")
def get_menu():


    collection = db["menu_items"]


    items = list(
        collection.find(
            {},
            {
                "_id":0
            }
        )
    )


    result=[]


    for item in items:


        result.append({

            "id":
            item.get(
                "menu_id"
            ),


            "name":
            item.get(
                "menu_name",
                ""
            ),


            "category":
            item.get(
                "category",
                "Other"
            ),


            "price":
            item.get(
                "price",
                0
            ),


            "cost_price":
            item.get(
                "cost_price",
                0
            ),


            "status":
            item.get(
                "available_status",
                ""
            ),


            "image":
            ""

        })


    return result



# ============================================================
# MENU CATEGORY
# ============================================================

@app.get("/api/menu/categories")
def get_menu_categories():

    return [

        {
            "id":"all",
            "name":"All",
            "emoji":"🍽️"
        },

        {
            "id":"main",
            "name":"Main",
            "emoji":"🍔"
        },

        {
            "id":"drink",
            "name":"Drink",
            "emoji":"🥤"
        },

        {
            "id":"dessert",
            "name":"Dessert",
            "emoji":"🍰"
        }

    ]
# ============================================================
# BRANCH API
# ============================================================

@app.get("/api/branches")
def get_branches():

    branches = list(
        db["branches"].find(
            {},
            {
                "_id":0
            }
        )
    )

    return branches



# ============================================================
# INGREDIENT API
# ============================================================

@app.get("/api/ingredients")
def get_ingredients():

    ingredients = list(
        db["ingredients"].find(
            {},
            {
                "_id":0
            }
        )
    )


    result=[]


    for item in ingredients:

        result.append({

            "IngredientId":
            item.get(
                "ingredient_id"
            ),


            "IngredientName":
            item.get(
                "ingredient_name",
                ""
            ),


            "UnitCost":
            item.get(
                "unit_cost",
                0
            )

        })


    return result




# ============================================================
# ALL ORDERS
# ============================================================

@app.get("/api/orders")
def get_orders():


    orders=list(
        db["orders"].find(
            {},
            {
                "_id":0
            }
        )
    )


    return orders




# ============================================================
# ANALYTICS DASHBOARD
# ============================================================

@app.get("/api/analytics/dashboard")
def analytics_dashboard():


    orders=list(
        db["orders"].find(
            {},
            {
                "_id":0
            }
        )
    )


    order_items=list(
        db["order_items"].find(
            {},
            {
                "_id":0
            }
        )
    )


    total_sales=0
    total_orders=len(orders)


    branch_sales=defaultdict(float)
    menu_sales=defaultdict(float)
    menu_quantity=defaultdict(int)
    daily_sales=defaultdict(float)



    # -------------------------------
    # Revenue
    # -------------------------------

    for order in orders:


        amount=float(
            order.get(
                "total_amount",
                0
            )
        )


        total_sales += amount


        branch_sales[
            order.get(
                "branch_id",
                "Unknown"
            )
        ] += amount



        daily_sales[
            order.get(
                "order_date",
                "Unknown"
            )
        ] += amount




    # -------------------------------
    # Menu sales
    # -------------------------------

    menu_map={}


    for menu in db["menu_items"].find():

        menu_map[
            menu.get("menu_id")
        ] = menu.get(
            "menu_name"
        )



    for item in order_items:


        name = menu_map.get(
            item.get("menu_id"),
            "Unknown"
        )


        subtotal=float(
            item.get(
                "subtotal",
                0
            )
        )


        qty=int(
            item.get(
                "quantity",
                0
            )
        )


        menu_sales[name]+=subtotal

        menu_quantity[name]+=qty




    top_menu=sorted(
        menu_quantity.items(),
        key=lambda x:x[1],
        reverse=True
    )[:10]



    return {


        "restaurant":
        "Taste & Treasure",


        "total_orders":
        total_orders,


        "total_sales":
        round(
            total_sales,
            2
        ),


        "top_menu":[

            {
                "name":name,
                "quantity":qty,
                "sales":
                round(
                    menu_sales[name],
                    2
                )
            }

            for name,qty in top_menu

        ],



        "branch_performance":[

            {
                "branch_id":branch,
                "sales":
                round(
                    sales,
                    2
                )
            }

            for branch,sales
            in branch_sales.items()

        ],



        "daily_sales":[

            {
                "date":date,
                "sales":
                round(
                   sales,
                    2
                )
            }

            for date,sales
            in daily_sales.items()

        ]

    }




# ============================================================
# ADMIN DASHBOARD
# ============================================================

@app.get("/api/admin/dashboard")
def admin_dashboard():


    total_orders = db[
        "orders"
    ].count_documents({})


    total_branches = db[
        "branches"
    ].count_documents({})


    total_menu = db[
        "menu_items"
    ].count_documents({})


    revenue = 0


    for order in db["orders"].find():

        revenue += float(
            order.get(
                "total_amount",
                0
            )
        )



    return {


        "restaurant":
        "Taste & Treasure",


        "total_orders":
        total_orders,


        "total_branches":
        total_branches,


        "total_menu":
        total_menu,


        "total_revenue":
        round(
            revenue,
            2
        )

    }



# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):

    username:str
    password:str




@app.post("/api/login")
def login(data:LoginRequest):


    user=db[
        "users"
    ].find_one(

        {
            "username":
            data.username,

            "password":
            data.password
        },

        {
            "_id":0
        }

    )


    if not user:

        return {

            "success":False,

            "message":
            "Invalid login"

        }


    return {

        "success":True,

        "user":user

    }




# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():


    try:

        client.admin.command(
            "ping"
        )


        print("==============================")
        print("Taste & Treasure API Started")
        print("MongoDB Connected")
        print("Database: restaurant_db")
        print("==============================")


    except Exception as e:

        print(
            "MongoDB connection failed"
        )

        print(e)