from fastapi import APIRouter
from database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter()


def convert_unit(value, from_unit, to_unit):
    if not from_unit or not to_unit:
        return value

    from_unit = str(from_unit).lower()
    to_unit = str(to_unit).lower()

    if from_unit == to_unit:
        return value

    conversions = {
        ("kg", "g"): 1000,
        ("g", "kg"): 0.001,
        ("l", "ml"): 1000,
        ("liter", "ml"): 1000,
        ("ml", "l"): 0.001,
        ("ml", "liter"): 0.001,
        ("mg", "g"): 0.001,
        ("g", "mg"): 1000,
        ("oz", "g"): 28.3495,
        ("g", "oz"): 0.035274,
        ("ounce", "gram"): 28.3495,
        ("gram", "ounce"): 0.035274,
    }

    factor = conversions.get((from_unit, to_unit))
    return value * factor if factor else value


# =====================================================
# CREATE ORDER
# =====================================================

@router.post("/api/orders")
def create_order(order: dict):
    items = []

    for item in order.get("items", []):
        menu = None
        dish_id = item.get("dishId")

        if dish_id:
            try:
                menu = db["menu_items"].find_one({
                    "$or": [
                        {"menu_id": dish_id},
                        {"MenuItemId": int(dish_id) if str(dish_id).isdigit() else -1},
                    ]
                })
            except Exception:
                pass

        if not menu:
            menu = db["menu_items"].find_one({
                "$or": [
                    {"Description": item.get("name")},
                    {"menu_name": item.get("name")},
                ]
            })

        if menu:
            item["recipeId"] = menu.get("RecipeId")
            item["menuItemId"] = menu.get("MenuItemId") or menu.get("menu_id")
            item["image"] = menu.get("Image") or menu.get("image") or "/menu/default.png"

        items.append(item)

    order_data = {
        "branchId": order.get("branchId"),
        "createdBy": order.get("createdBy", "customer"),
        "items": items,
        "total": order.get("total", order.get("total_amount", 0)),
        "status": "pending",
        "createdAt": datetime.now(),
    }

    result = db["orders"].insert_one(order_data)

    return {"success": True, "orderId": str(result.inserted_id)}


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
# DATASET ORDER ITEM ENRICHMENT
# =====================================================

def _get_dataset_order_items(order_id: str, branch_id: str):
    """Build the same item shape used by newly-created orders.

    Dataset orders live in `orders` with order_id/branch_id fields, while
    their line items live in `order_items`. The old endpoint returned those
    orders with an empty `items` array, which made the branch manager page
    show `0 items` for every historical order.
    """
    raw_items = list(db["order_items"].find({"order_id": order_id}))

    if not raw_items:
        return []

    items = []
    for raw in raw_items:
        menu_id = raw.get("menu_id")
        menu = db["menu_items"].find_one({
            "$or": [
                {"menu_id": menu_id},
                {"MenuItemId": menu_id},
            ]
        }) if menu_id is not None else None

        # Do not leak a menu item from another branch if the same menu id is
        # reused. Dataset menu_items normally has globally unique menu_id.
        if menu and menu.get("branch_id") not in (None, branch_id):
            menu = None

        name = (menu or {}).get("menu_name") or (menu or {}).get("Description") or f"Menu {menu_id}"
        price = raw.get("unit_price", (menu or {}).get("price", 0))
        quantity = raw.get("quantity", 0)

        try:
            quantity = int(float(quantity or 0))
        except (TypeError, ValueError):
            quantity = 0

        try:
            price = float(price or 0)
        except (TypeError, ValueError):
            price = 0.0

        image = (menu or {}).get("image") or (menu or {}).get("Image")
        if not image and menu_id:
            image = f"/menu/{menu_id}.jpg"

        items.append({
            "menu_id": menu_id,
            "menu_name": name,
            "name": name,
            "quantity": quantity,
            "unit_price": price,
            "price": price,
            "subtotal": raw.get("subtotal", quantity * price),
            "image": image,
        })

    return items


# =====================================================
# GET ORDERS FOR BRANCH
# =====================================================

@router.get("/api/orders/{branch_id}")
def get_orders(branch_id: str):
    # New orders use branchId. Historical dataset orders use branch_id.
    orders = list(db["orders"].find({
        "$or": [
            {"branchId": branch_id},
            {"branchId": str(branch_id)},
            {"branch_id": branch_id},
            {"branch_id": str(branch_id)},
        ]
    }).sort([("createdAt", -1), ("order_date", -1), ("order_id", -1)]))

    result = []

    for order in orders:
        # Dataset order: join order_items + menu_items so historical orders
        # display their actual purchased dishes instead of 0 items.
        if order.get("order_id") and "branch_id" in order:
            dataset_order_id = str(order["order_id"])
            dataset_branch_id = str(order.get("branch_id", branch_id))
            items = _get_dataset_order_items(dataset_order_id, dataset_branch_id)

            order["_id"] = dataset_order_id
            order["id"] = dataset_order_id
            order["branchId"] = dataset_branch_id
            order["items"] = items
            order["total"] = order.get("total_amount", 0)
            order["total_amount"] = order.get("total_amount", 0)
            order["createdAt"] = order.get("order_date")

        else:
            order["_id"] = str(order["_id"])

        result.append(order)

    return result


# =====================================================
# CONFIRM ORDER
# =====================================================

@router.put("/api/orders/{order_id}/confirm")
def confirm_order(order_id: str):
    try:
        order = db["orders"].find_one({"_id": ObjectId(order_id)})
    except Exception:
        return {"success": False, "message": "Invalid order id"}

    if not order:
        return {"success": False, "message": "Order not found"}

    if order.get("status") == "confirmed":
        return {"success": False, "message": "Already confirmed"}

    branch_id = order.get("branchId")
    stock_updates = []

    # =====================================================
    # STOCK DEDUCTION (ONLY THIS BRANCH)
    # =====================================================

    for item in order.get("items", []):
        recipe_id = item.get("recipeId")

        if not recipe_id:
            menu = db["menu_items"].find_one({
                "$or": [
                    {"Description": item.get("name")},
                    {"menu_name": item.get("name")},
                ]
            })
            if menu:
                recipe_id = menu.get("RecipeId")

        if not recipe_id:
            continue

        recipes = list(db["recipe_ingredient_assignments"].find({
            "$or": [
                {"RecipeId": recipe_id},
                {"RecipeId": str(recipe_id)},
                {"RecipeId": int(recipe_id)},
            ]
        }))

        try:
            quantity_ordered = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            quantity_ordered = 1

        for recipe in recipes:
            ingredient_id = recipe.get("IngredientId")
            try:
                recipe_qty = float(recipe.get("Quantity", 0))
            except (TypeError, ValueError):
                recipe_qty = 0

            recipe_unit = recipe.get("Unit", "")

            inventory = db["branch_inventory"].find_one({
                "$and": [
                    {"$or": [
                        {"branchId": branch_id},
                        {"branchId": str(branch_id)},
                    ]},
                    {"$or": [
                        {"IngredientId": ingredient_id},
                        {"IngredientId": str(ingredient_id)},
                    ]},
                ]
            })

            if not inventory:
                continue

            stock_unit = inventory.get("Unit", "")
            used = convert_unit(recipe_qty, recipe_unit, stock_unit) * quantity_ordered
            before = float(inventory.get("Stock", 0))

            if before < used:
                continue

            remaining = before - used

            db["branch_inventory"].update_one(
                {"_id": inventory["_id"]},
                {"$set": {"Stock": remaining}},
            )

            db["inventory_transactions"].insert_one({
                "orderId": order_id,
                "branchId": branch_id,
                "IngredientId": ingredient_id,
                "IngredientName": inventory.get("IngredientName", "Unknown"),
                "beforeStock": before,
                "used": used,
                "unit": stock_unit,
                "remaining": remaining,
                "createdAt": datetime.now(),
            })

            stock_updates.append({
                "IngredientName": inventory.get("IngredientName"),
                "Used": used,
                "Unit": stock_unit,
                "Remaining": remaining,
            })

    # =====================================================
    # SAVE SALES DETAILS
    # =====================================================

    for item in order.get("items", []):
        qty = item.get("quantity", 1)
        price = item.get("price", item.get("unit_price", 0))

        db["order_details"].insert_one({
            "StoreNumber": branch_id,
            "OrderId": order_id,
            "Description": item.get("name", item.get("menu_name", "Unknown")),
            "Quantity": qty,
            "Price": price,
            "Total": qty * price,
            "date": datetime.now().strftime("%Y-%m-%d"),
        })

    db["orders"].update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": "confirmed", "confirmedAt": datetime.now()}},
    )

    return {
        "success": True,
        "message": "Order confirmed successfully",
        "stockUpdated": stock_updates,
    }
