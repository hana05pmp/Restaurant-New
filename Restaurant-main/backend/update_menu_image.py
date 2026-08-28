from pymongo import MongoClient


MONGO_URL = "mongodb://127.0.0.1:27017"


client = MongoClient(MONGO_URL)


db = client["restaurant_db"]



collection = db["menu_items"]





# =====================================================
# IMAGE RULES
# =====================================================


def get_image(menu_name):


    name = menu_name.lower()



    # Sandwich
    if "ham" in name:

        return (
            "https://images.unsplash.com/"
            "photo-1509722747041-616f39b57569"
        )



    if "chicken" in name:

        return (
            "https://images.unsplash.com/"
            "photo-1553979459-d2229ba7433b"
        )



    if "turkey" in name:

        return (
            "https://images.unsplash.com/"
            "photo-1528735602780-2552fd46c7af"
        )



    # Pizza

    if "pizza" in name or "piza" in name:

        return (
            "https://images.unsplash.com/"
            "photo-1513104890138-7c749659a591"
        )



    # Cookie

    if "cookie" in name:

        return (
            "https://images.unsplash.com/"
            "photo-1558961363-fa8fdf82db35"
        )



    # Drink

    if (
        "drink" in name
        or
        "beverage" in name
        or
        "water" in name
    ):

        return (
            "https://images.unsplash.com/"
            "photo-1544145945-f90425340c7e"
        )



    # Default

    return (
        "https://images.unsplash.com/"
        "photo-1600891964092-4316c288032e"
    )







# =====================================================
# UPDATE
# =====================================================


menus = collection.find()



count = 0



for menu in menus:


    name = menu.get(
        "MenuItemName",
        ""
    )


    image = get_image(
        name
    )



    collection.update_one(

        {
            "_id":
            menu["_id"]
        },


        {

        "$set":{

            "Image":
            image

        }

        }

    )


    count += 1



print(
    "Updated:",
    count,
    "menu items"
)