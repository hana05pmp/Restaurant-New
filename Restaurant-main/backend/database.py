from pymongo import MongoClient
MONGO_URL = "mongodb://127.0.0.1:27017"
client = MongoClient(MONGO_URL)
db = client["restaurant_db"]