from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict
from datetime import datetime, timedelta
import math
from orders import router as order_router
from branch_dashboard import router as branch_dashboard_router
from branch_inventory import router as branch_inventory_router
from database import client, db
from sales_report import router as sales_report_router

app = FastAPI(
    title="Ember & Oak Restaurant API",
    version="1.0.0"
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[

        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
        "http://127.0.0.1:5173",

    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ROUTES
# ============================================================

app.include_router(
    branch_dashboard_router
)

app.include_router(
    order_router
)

app.include_router(
    branch_inventory_router
)

app.include_router(
    sales_report_router
)
# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "message":
        "Ember & Oak API is running"

    }

# ============================================================
# HEALTH
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
# MENU
# ============================================================

@app.get("/api/menu")
def get_menu(branch_id: str | None = None):

    menu_collection = db["menu_items"]
    price_collection = db["menuitem"]

    # ========================================================
    # PRICE MAP
    # ========================================================

    price_map = {}

    for p in price_collection.find(
        {},
        {
            "_id":0,
            "PLU":1,
            "Price":1
        }
    ):

        if p.get("PLU"):
            price_map[p["PLU"]] = p.get(
                "Price",
                0
            )

    # ========================================================
    # MENU DATA
    # ========================================================

    items = list(
        menu_collection.find(
            {"branch_id": branch_id} if branch_id else {},
            {
                "_id":0
            }
        )
    )
    result = []

    for item in items:
        name = str(item.get("menu_name") or item.get("MenuItemName") or "").strip()

        description = str(item.get("description") or item.get("MenuItemDescription") or "").strip()

        text = (
            f"{name} {description}"
        ).lower()

        # ====================================================
        # IMPROVED CATEGORY
        # ====================================================

        category = str(item.get("category") or "Other").strip()

        # Sandwiches
        if not item.get("category") and any(
            word in text
            for word in [

                "ham",
                "turkey",
                "bmt",
                "b.m.t",
                "blt",
                "club",
                "sub",
                "ftl",
                "ftlong",
                "6 inch",
                "flatbd",
                "flatbread",
                "sandwich",
                "chicken teriyaki",
                "chxtry",
                "bbq rib",
                "bqrib",
                "philly",
                "steak"
            ]
        ):
            category = "Sandwiches"

        # Burgers

        elif not item.get("category") and any(
            word in text
            for word in [
                "burger",
                "hamburger",
                "cheeseburger",
                "cheese burger"
            ]
        ):
            category = "Burgers"

        # Pizza

        elif not item.get("category") and any(
            word in text
            for word in [
                "pizza",
                "pepperoni"
            ]
        ):
            category = "Pizza"

        # Salads

        elif not item.get("category") and any(
            word in text
            for word in [
                "salad",
                "veggie bowl"
            ]
        ):
            category = "Salads"

        # Desserts
        elif not item.get("category") and any(
            word in text
            for word in [

                "cookie",
                "cake",
                "brownie",
                "dessert",
                "ice cream",
                "icecream"
            ]
        ):
            category = "Desserts"

        # ====================================================
        # PRICE
        # ====================================================

        plu = item.get("PLU")
        price = item.get("price", price_map.get(plu, 0))
        try:
            price = float(price)
        except:
            price = 0

        # ====================================================
        # RESPONSE
        # ====================================================

        result.append({

            "id": item.get("menu_id") or item.get("MenuItemId"),
            "name": name,
            "description": description,
            "plu": plu,
            "recipeId": item.get(
                "RecipeId"
            ),
            "category": category,
            "price": price,
            "costPrice": float(item.get("cost_price") or 0),
            "availableStatus": item.get("available_status") or "Available",
            "image": item.get("image") or f"/menu/{item.get('menu_id') or item.get('MenuItemId')}.jpg"
        })
    return result

# ============================================================
# CATEGORY API
# ============================================================

@app.get("/api/menu/categories")
def get_menu_categories():
    values = db["menu_items"].distinct("category")
    return [{"id": "all", "name": "All", "emoji": "🍽️"}] + [
        {"id": str(value).lower(), "name": str(value), "emoji": "🍴"}
        for value in values if value
    ]

@app.get("/api/menu/{branch_id}")
def get_menu_by_branch(branch_id: str):
    return get_menu(branch_id)

# ============================================================
# OTHER DATA
# ============================================================

@app.get("/api/branches")
def get_branches():

    branches = list(
        db["branches"].find(
            {},
            {"_id":0}
        )
    )

    result=[]

    for b in branches:
        result.append({

            "branchId": b.get("branch_id"),
            "branchName": b.get("branch_name", "").strip(),

            "city": b.get(
                "city",
                ""
            ).strip(),

            "state": b.get("state", "").strip(),

        })

    return result

@app.get("/api/ingredients")
def get_ingredients():

    ingredients = list(
        db["ingredients"].find({})
    )

    result = []

    for item in ingredients:
        result.append({

            "IngredientId": item.get("ingredient_id") or item.get("IngredientId"),

            "IngredientName": item.get(
                "ingredient_name",
                item.get("IngredientName", "")
            ).strip(),

            "Stock": item.get(
                "unit_cost",
                item.get("Stock", 0)
            ),

            "Unit": item.get(
                "Unit",
                ""
            )

        })
    return result

@app.get("/api/recipes")
def get_recipes():

    return list(
        db["recipes"].find(
            {},
            {"_id":0}
        )
    )

@app.get("/api/orders")
def get_live_orders():
    orders = list(
        db["orders"].find({})
    )
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

# ============================================================
# STARTUP
# ============================================================


@app.on_event("startup")
def startup_event():

    try:

        client.admin.command("ping")

        print("==============================")
        print("Ember & Oak API Started")
        print("MongoDB Connected")
        print("Database: restaurant_db")
        print("==============================")

    except Exception as e:

        print("MongoDB connection failed")
        print(e)

# ============================================================
# ANALYTICS - SALES OVERVIEW
# ============================================================

@app.get("/api/menu-insights")
def menu_insights(branch_id: str = "all"):
    menu_items = list(db["menu_items"].find({}, {"_id": 0}))
    branches = list(db["branches"].find({}, {"_id": 0}))
    orders = list(db["orders"].find({}, {"_id": 0}))
    order_items = list(db["order_items"].find({}, {"_id": 0}))

    valid_statuses = {"completed", "complete", "paid", "placed", "preparing", "ready"}
    selected_orders = {
        str(order.get("order_id")): order
        for order in orders
        if str(order.get("status", "completed")).strip().lower() not in {"cancelled", "canceled", "invalid"}
        and (branch_id == "all" or str(order.get("branch_id")) == branch_id)
    }
    rows = {
        str(item.get("menu_id")): {
            "menuId": str(item.get("menu_id")),
            "menu": item.get("menu_name", "Unknown menu"),
            "category": item.get("category", "Unknown"),
            "image": item.get("image", ""),
            "sold": 0,
            "revenue": 0.0,
            "orders": 0,
            "recent": 0,
            "previous": 0,
        }
        for item in menu_items
    }
    dates = [
        datetime.fromisoformat(str(order.get("order_date")))
        for order in selected_orders.values()
        if order.get("order_date")
    ]
    latest = max(dates) if dates else datetime.now()
    split = latest - timedelta(days=30)
    previous_split = latest - timedelta(days=60)
    for item in order_items:
        order = selected_orders.get(str(item.get("order_id")))
        menu_id = str(item.get("menu_id"))
        if not order or menu_id not in rows:
            continue
        quantity = float(item.get("quantity") or 0)
        revenue = float(item.get("subtotal") or quantity * float(item.get("unit_price") or 0))
        row = rows[menu_id]
        row["sold"] += quantity
        row["revenue"] += revenue
        row["orders"] += 1
        order_date = datetime.fromisoformat(str(order.get("order_date")))
        if order_date >= split:
            row["recent"] += quantity
        elif order_date >= previous_split:
            row["previous"] += quantity

    active_rows = list(rows.values())
    max_values = [max((row[key] for row in active_rows), default=1) or 1 for key in ("sold", "revenue", "orders")]
    for row in active_rows:
        row["growth"] = None if row["previous"] == 0 and row["recent"] == 0 else round(((row["recent"] - row["previous"]) / row["previous"] * 100), 1) if row["previous"] else None
        row["score"] = round((row["sold"] / max_values[0] * 45) + (row["revenue"] / max_values[1] * 35) + (row["orders"] / max_values[2] * 20), 1)

    # Small, deterministic K-Means over supported performance features.
    features = [[row["sold"] / max_values[0], row["revenue"] / max_values[1], row["orders"] / max_values[2], (row["growth"] or 0) / 100] for row in active_rows]
    k = min(4, len(features))
    centroids = [features[index][:] for index in [0, len(features) // 3, (len(features) * 2) // 3, len(features) - 1][:k]] if features else []
    for _ in range(12):
        groups = [[] for _ in range(k)]
        for feature in features:
            index = min(range(k), key=lambda center: sum((feature[i] - centroids[center][i]) ** 2 for i in range(4)))
            groups[index].append(feature)
        for index, group in enumerate(groups):
            if group:
                centroids[index] = [sum(feature[i] for feature in group) / len(group) for i in range(4)]

    ranked_centers = sorted(range(k), key=lambda index: sum(centroids[index][:3]), reverse=True)
    label_by_cluster = {index: "Needs Attention" for index in range(k)}
    if ranked_centers:
        label_by_cluster[ranked_centers[0]] = "Best Sellers"
    if len(ranked_centers) > 1:
        label_by_cluster[max(ranked_centers[1:], key=lambda index: centroids[index][3])] = "Rising Stars"
    for row, feature in zip(active_rows, features):
        cluster = min(range(k), key=lambda center: sum((feature[i] - centroids[center][i]) ** 2 for i in range(4))) if k else 0
        row["group"] = label_by_cluster.get(cluster, "Needs Attention")
        row["profit"] = None
        row["trend"] = "No trend data" if row["growth"] is None else f"{row['growth']:+.1f}%"
        row["action"] = {"Best Sellers": "Keep & Promote", "Rising Stars": "Promote", "Needs Attention": "Review / Consider Dropping"}.get(row["group"], "Review")
    active_rows.sort(key=lambda row: row["score"], reverse=True)
    group_names = ["Best Sellers", "Rising Stars", "Popular but Low Margin", "Needs Attention"]
    groups_response = []
    for name in group_names:
        members = [row for row in active_rows if row.get("group") == name]
        groups_response.append({"name": name, "count": len(members), "example": members[0]["menu"] if members else None})
    trending = sorted([row for row in active_rows if row["growth"] is not None], key=lambda row: row["growth"], reverse=True)[:6]
    return {"branches": [{"id": b.get("branch_id"), "name": b.get("branch_name"), "city": b.get("city", "")} for b in branches], "hasProfit": False, "groups": groups_response, "rows": active_rows, "trending": trending}
# ============================================================
# ANALYTICS DASHBOARD
# ============================================================

@app.get("/api/analytics/dashboard")
def analytics_dashboard():

    collection = db["order_details"]


    data = list(
        collection.find(
            {},
            {
                "_id": 0,
                "Description": 1,
                "CategoryDescription": 1,
                "StoreNumber": 1,
                "Price": 1,
                "AdjustedPrice": 1,
                "Quantity": 1,
                "date": 1
            }
        )
    )

    total_sales = 0
    total_quantity = 0

    menu_sales = defaultdict(float)
    menu_quantity = defaultdict(float)
    category_sales = defaultdict(float)
    branch_sales = defaultdict(float)
    daily_sales = defaultdict(float)

    for item in data:

        # ============================================
        # PRICE
        # ============================================

        price = item.get(
            "Price",
            item.get(
                "AdjustedPrice",
                0
            )
        )

        quantity = item.get(
            "Quantity",
            0
        )

        try:

            price = float(price)

        except:
            price = 0

        try:
            quantity = float(quantity)
        except:
            quantity = 0

        # SALES = PRICE × QUANTITY

        amount = price * quantity
        total_sales += amount
        total_quantity += quantity

        # ============================================
        # MENU SALES
        # ============================================

        menu = item.get(
            "Description",
            "Unknown"
        )

        menu_sales[menu] += amount
        menu_quantity[menu] += quantity

        # ============================================
        # CATEGORY SALES
        # ============================================

        category = item.get(
            "CategoryDescription",
            "Unknown"
        )

        category_sales[category] += amount

        # ============================================
        # BRANCH SALES
        # ============================================

        branch = str(
            item.get(
                "StoreNumber",
                "Unknown"
            )
        )

        branch_sales[branch] += amount

        # ============================================
        # DAILY SALES
        # ============================================


        date = item.get(
            "date",
            "Unknown"
        )

        daily_sales[date] += amount

    # ============================================
    # TOP / LEAST SELLING MENU
    # ============================================


    top_menu = sorted(
        menu_quantity.items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]

    least_menu = sorted(
        menu_quantity.items(),
        key=lambda x: x[1]
    )[:10]

    return {

        "total_sales": round(
            total_sales,
            2
        ),

        "total_quantity": round(
            total_quantity,
            2
        ),

        "top_menu":[

            {
                "name": name,

                "quantity": round(
                    qty,
                    2
                ),
                "sales": round(
                    menu_sales[name],
                    2
                )
            }
            for name, qty in top_menu
        ],

        "least_menu":[
            {
                "name": name,
                "quantity": round(
                    qty,
                    2
                ),

                "sales": round(
                    menu_sales[name],
                    2
                )
            }
            for name, qty in least_menu
        ],

        "category_sales":[
            {
                "category": name,
                "sales": round(
                    value,
                    2
                )
            }
            for name, value in sorted(
                category_sales.items(),
                key=lambda x:x[1],
                reverse=True
            )
        ],

        "branch_performance":[
            {
                "store": name,
                "sales": round(
                    value,
                    2
                )
            }

            for name, value in sorted(
                branch_sales.items(),
                key=lambda x:x[1],
                reverse=True
            )
        ],

        "daily_sales":[
            {
                "date": name,
                "sales": round(
                    value,
                    2
                )
            }
            for name, value in daily_sales.items()
        ]
    }
# ============================================================
# ADMIN DASHBOARD OVERVIEW
# ============================================================

@app.get("/api/admin/dashboard")
def admin_dashboard():

    # Orders
    total_orders = db["order_details"].count_documents({})

    # Branches
    branches = list(
        db["store_restaurant"].find(
            {},
            {
                "_id":0
            }
        )
    )
    total_branches = len(branches)
    loyalty_branches = 0

    for b in branches:
        if b.get(
            "STORE_LOYALTY_FLAG"
        ) == "Y":
            loyalty_branches += 1

    # Orders by branch
    pipeline = [

        {
            "$group":{
                "_id":"$StoreNumber",
                "orders":{
                    "$sum":1
                }
            }
        },

        {
            "$sort":{
                "orders":-1
            }
        }
    ]

    branch_orders = list(
        db["order_details"].aggregate(
            pipeline
        )
    )

    return {
        "total_orders": total_orders,
        "total_branches": total_branches,
        "loyalty_branches": loyalty_branches,

        "branch_orders":[
            {
                "storeNumber":x["_id"],
                "orders":x["orders"]
            }
            for x in branch_orders
        ]
    }

@app.get("/api/admin/branch-performance")
def branch_performance():
    branches = list(db["branches"].find({}, {"_id": 0}))
    orders = list(db["orders"].find({}, {"_id": 0}))
    performance = []
    for branch in branches:
        branch_id = branch.get("branch_id")
        branch_orders = [
            order for order in orders
            if (order.get("branchId") or order.get("branch_id")) == branch_id
        ]
        active_orders = [order for order in branch_orders if order.get("status") not in {"cancelled", "Cancelled"}]
        revenue = sum(float(order.get("total_amount", order.get("total", 0)) or 0) for order in active_orders)
        completed = sum(1 for order in active_orders if str(order.get("status", "")).lower() in {"completed", "confirmed"})
        average_order = revenue / len(active_orders) if active_orders else 0
        performance.append({
            "branchId": branch_id,
            "branchName": branch.get("branch_name", "").strip(),
            "city": branch.get("city", "").strip(),
            "orders": len(active_orders),
            "completedOrders": completed,
            "revenue": round(revenue, 2),
            "averageOrder": round(average_order, 2),
            "performanceScore": 0,
        })
    max_orders = max((item["orders"] for item in performance), default=1)
    max_revenue = max((item["revenue"] for item in performance), default=1)
    for item in performance:
        completion_rate = item["completedOrders"] / item["orders"] if item["orders"] else 0
        item["performanceScore"] = round(
            100 * (0.4 * item["orders"] / max_orders + 0.4 * item["revenue"] / max_revenue + 0.2 * completion_rate),
            1,
        )
    return sorted(performance, key=lambda item: item["performanceScore"], reverse=True)

class LoginRequest(BaseModel):
    username:str
    password:str

@app.post("/api/login")
def login(data:LoginRequest):

    customer_accounts = {
        "customer1": "BR001",
        "customer2": "BR002",
        "customer3": "BR003",
        "customer4": "BR004",
    }
    username = data.username.strip().lower()
    if username in customer_accounts and data.password == f"c{username[-1]}":
        return {
            "success": True,
            "user": {
                "_id": username,
                "username": username,
                "name": f"Customer {username[-1]}",
                "phone": "",
                "role": "customer",
                "branchId": customer_accounts[username],
            },
        }

    manager_accounts = {
        "branch1": ("b1", "BR001", "Hlaing Taste Manager"),
        "branch2": ("b2", "BR002", "Downtown Taste Manager"),
        "branch3": ("b3", "BR003", "Sanchaung Kitchen Manager"),
        "branch4": ("b4", "BR004", "Bahan Kitchen Manager"),
    }
    if username in manager_accounts and data.password == manager_accounts[username][0]:
        password, branch_id, name = manager_accounts[username]
        return {"success": True, "user": {"_id": username, "username": username, "name": name, "phone": "", "role": "branch_manager", "branchId": branch_id}}

    if username == "admin" and data.password == "mainadmin":
        return {"success": True, "user": {"_id": "admin", "username": "admin", "name": "Main Admin", "phone": "", "role": "main_admin"}}

    user = db["users"].find_one(
        {
            "username":data.username,
            "password":data.password
        },
        {
            "_id":0
        }
    )

    if not user:
        return {
            "success":False,
            "message":"Invalid login"
        }

    return {
        "success":True,
        "user":user
    }
class RegisterRequest(BaseModel):
    username:str
    name:str
    phone:str
    password:str

# @app.post("/api/register")
# def register(data:RegisterRequest):

    # exist = db["users"].find_one(
# /        {
        #    "username":data.username
        # }
    # )

    # if exist:
        # return {
            # "success":False,
            # "message":"Username already exists"
        # }

    # user = {
        # "username":data.username,
        # "name":data.name,
        # "phone":data.phone,
        # "password":data.password,
        # "role":"customer"
    # }

    # db["users"].insert_one(user)

    # return {
        # "success":True,
        # "message":"Account created"
    # }