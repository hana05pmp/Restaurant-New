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



    if unit == "g" and stock >= 1000:

        return round(stock / 1000, 2), "kg"



    if unit == "ml" and stock >= 1000:

        return round(stock / 1000, 2), "liter"



    return stock, unit







# ==========================================
# INITIALIZE INVENTORY
# ==========================================


@router.post("/api/branch-inventory/init")
def initialize_branch_inventory():



    branches = list(
        db["branches"].find({})
    )



    ingredients = list(
        db["ingredients"].find({})
    )



    created = 0




    for branch in branches:



        branch_id = branch.get(
            "branch_id"
        )



        for ingredient in ingredients:



            ingredient_id = ingredient.get(
                "ingredient_id"
            )



            exists = db["branch_inventory"].find_one({

                "branch_id":
                branch_id,


                "ingredient_id":
                ingredient_id

            })



            if exists:
                continue






            data = {


                "inventory_id":

                f"INV-{branch_id}-{ingredient_id}",



                "branch_id":

                branch_id,



                "ingredient_id":

                ingredient_id,



                "ingredient_name":

                ingredient.get(
                    "ingredient_name"
                ),



                "stock_quantity":

                100,



                "unit":

                ingredient.get(
                    "unit",
                    "unit"
                ),



                "created_at":

                datetime.now()

            }




            db["branch_inventory"].insert_one(
                data
            )


            created += 1





    return {


        "success":

        True,


        "message":

        "Inventory initialized",


        "created":

        created

    }









# ==========================================
# GET BRANCH INVENTORY
# ==========================================


@router.get("/api/branch-inventory/{branch_id}")
def get_branch_inventory(branch_id:str):


    inventory = list(

        db["branch_inventory"].find(

            {

            "branch_id":
            branch_id

            },

            {

            "_id":0

            }

        )

    )




    result = []




    for item in inventory:



        stock, unit = convert_unit(

            item.get(
                "stock_quantity",
                0
            ),


            item.get(
                "unit",
                ""
            )

        )





        # ==========================
        # GET INGREDIENT NAME
        # ==========================


        ingredient = db["ingredients"].find_one({

            "ingredient_id":

            item.get(
                "ingredient_id"
            )

        })




        ingredient_name = (


            ingredient.get(
                "ingredient_name"
            )


            if ingredient


            else


            item.get(
                "ingredient_name",
                "Unknown Ingredient"
            )


        )







        result.append({



            "ingredient_id":


            item.get(
                "ingredient_id"
            ),




            "ingredient_name":


            ingredient_name,




            "stock_quantity":


            stock,




            "unit":


            unit,




            "branch_id":


            item.get(
                "branch_id"
            )



        })





    return result