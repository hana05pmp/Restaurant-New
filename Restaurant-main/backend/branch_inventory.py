from fastapi import APIRouter
from database import db
from datetime import datetime


router = APIRouter()



# ==========================================
# UNIT CONVERSION
# ==========================================

def convert_unit(stock, unit):

    if stock is None:
        stock = 0


    if unit is None:
        unit = ""


    unit = unit.lower()



    if unit == "mg" and stock >= 1000:

        return round(stock / 1000,2), "g"



    if unit == "g" and stock >= 1000:

        return round(stock / 1000,2), "kg"



    if unit == "ml" and stock >= 1000:

        return round(stock / 1000,2), "L"



    return stock, unit

# ==========================================
# INITIALIZE BRANCH INVENTORY
# ==========================================


@router.post("/api/branch-inventory/init")
def initialize_branch_inventory():


    branches = list(
        db["store_restaurant"].find({})
    )


    ingredients = list(
        db["ingredients"].find({})
    )


    created = 0



    for branch in branches:


        branch_id = branch.get(
            "STORE_NUMBER"
        )


        if branch_id:

            branch_id = int(branch_id)



        for ingredient in ingredients:


            ingredient_id = ingredient.get(
                "IngredientId"
            )


            exists = db["branch_inventory"].find_one({

                "branchId": branch_id,

                "IngredientId": ingredient_id

            })


            if exists:
                continue




            data = {


                "branchId":
                branch_id,


                "IngredientId":
                ingredient_id,


                "IngredientName":
                ingredient.get(
                    "IngredientName"
                ),



                # IMPORTANT
                # Every branch starts with 1000

                "Stock":
                1000,



                "Unit":
                "unit",



                "createdAt":
                datetime.now()

            }




            db["branch_inventory"].insert_one(
                data
            )


            created += 1





    return {


        "success":True,


        "message":
        "Branch inventory initialized with default stock",


        "created":
        created

    }
# ==========================================
# GET BRANCH INVENTORY
# ==========================================


@router.get("/api/branch-inventory/{branch_id}")
def get_branch_inventory(branch_id: str):
    legacy_id = int(branch_id) if branch_id.isdigit() else -1
    ingredient_names = {
        item.get("ingredient_id"): item.get("ingredient_name", "Unknown")
        for item in db["ingredients"].find({}, {"_id": 0, "ingredient_id": 1, "ingredient_name": 1})
    }
    inventory = list(db["branch_inventory"].find(
        {"$or": [
            {"branch_id": branch_id},
            {"branchId": branch_id},
            {"branchId": legacy_id},
        ]},
        {"_id": 0},
    ))

    if not inventory:
        inventory = [
            {
                "branch_id": branch_id,
                "ingredient_id": ingredient_id,
                "ingredient_name": name,
                "stock_quantity": 0,
                "unit": unit,
            }
            for ingredient_id, name, unit in db["ingredients"].find(
                {}, {"_id": 0, "ingredient_id": 1, "ingredient_name": 1, "unit": 1}
            ).sort("ingredient_id", 1)
        ]

    result = []
    for item in inventory:
        stock, unit = convert_unit(
            item.get("Stock", item.get("stock_quantity", 0)),
            item.get("Unit", item.get("unit", "")),
        )
        result.append({
            "IngredientId": item.get("IngredientId", item.get("ingredient_id")),
            "IngredientName": item.get("IngredientName", item.get("ingredient_name", ingredient_names.get(item.get("ingredient_id"), "Unknown"))),
            "Stock": stock,
            "Unit": unit,
            "branchId": item.get("branchId", item.get("branch_id", branch_id)),
        })

    return result