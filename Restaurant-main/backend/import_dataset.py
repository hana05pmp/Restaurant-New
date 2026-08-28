import os
from pathlib import Path
import pandas as pd
from pymongo import MongoClient


MONGO_URL = "mongodb://127.0.0.1:27017"

client = MongoClient(MONGO_URL)

db = client["restaurant_db"]


DATASET_FOLDER = Path(__file__).resolve().parent.parent / "dataset"


def import_csv(filename):

    file_path = DATASET_FOLDER / filename

    collection_name = os.path.splitext(filename)[0]

    print()
    print("Importing:", filename)

    df = pd.read_csv(file_path)

    if collection_name == "menu_items":
        if "cost_price" not in df.columns:
            df["cost_price"] = 0
        if "available_status" not in df.columns:
            df["available_status"] = "Available"
        if "image" not in df.columns:
            df["image"] = df["menu_id"].map(lambda menu_id: f"/menu/{menu_id}.jpg")

    df = df.where(pd.notnull(df), None)

    records = df.to_dict("records")

    if len(records) == 0:
        print("No data found.")
        return

    collection = db[collection_name]

    collection.delete_many({})

    collection.insert_many(records)

    print(
        f"SUCCESS: {collection_name} "
        f"({len(records)} records)"
    )


def main():

    print("================================")
    print("Restaurant Dataset Import")
    print("================================")

    files = [
        file
        for file in os.listdir(DATASET_FOLDER)
        if file.endswith(".csv")
    ]

    print("CSV files found:", len(files))

    for file in files:

        try:
            import_csv(file)

        except Exception as error:

            print()
            print("FAILED:", file)
            print(error)

    print()
    print("================================")
    print("IMPORT FINISHED")
    print("================================")


if __name__ == "__main__":
    main()