from fastapi import APIRouter
from database import db


router = APIRouter()



@router.post("/api/register")
def register(user:dict):


    existing = db["users"].find_one(
        {
            "username":user.get("username")
        }
    )


    if existing:

        return {
            "success":False,
            "message":"Username already exists"
        }



    user_data = {

        "username":
        user.get("username"),


        "password":
        user.get("password"),


        "name":
        user.get("name"),


        "phone":
        user.get("phone",""),


        "role":
        "customer"

    }



    result = db["users"].insert_one(
        user_data
    )


    return {

        "success":True,

        "message":"Account created",

        "id":str(result.inserted_id)

    }