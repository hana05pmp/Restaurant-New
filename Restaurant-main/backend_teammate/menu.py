from fastapi import APIRouter
from database import db


router = APIRouter()


# ==========================================
# GET ALL MENU (ADMIN)
# ==========================================

@router.get("/api/menu")
def get_all_menu():

    menus=list(
        db["menu_items"].find(
            {},
            {"_id":0}
        )
    )


    for m in menus:

        m["id"]=m["menu_id"]

        m["name"]=m["menu_name"]

        m["description"]="Delicious menu item."

        m["image"]=m.get(
            "image",
            ""
        )


    return menus




# ==========================================
# GET MENU BY BRANCH
# ==========================================
@router.get("/api/menu/{branch_id}")
def get_menu_by_branch(branch_id:str):


    menus=list(
        db["menu_items"].find(
            {
                "branch_id":branch_id
            },
            {
                "_id":0
            }
        )
    )


    for m in menus:

        m["id"]=m["menu_id"]

        m["name"]=m["menu_name"]

        m["description"]="Delicious menu item."

        m["image"]=m.get(
            "image",
            ""
        )


    return menus