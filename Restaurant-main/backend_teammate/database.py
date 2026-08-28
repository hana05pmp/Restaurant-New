from pymongo import MongoClient


client = MongoClient(
    "mongodb://127.0.0.1:27017/",
    serverSelectionTimeoutMS=5000
)


db = client["restaurant_db"]


try:

    client.admin.command("ping")

    print("MongoDB Connected")

except Exception as e:

    print("MongoDB Error:", e)