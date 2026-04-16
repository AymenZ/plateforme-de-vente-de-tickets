import os
from functools import lru_cache

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "eventdb_comments")


@lru_cache(maxsize=1)
def get_mongo_client() -> MongoClient:
    return MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)


@lru_cache(maxsize=1)
def get_mongo_database() -> Database:
    return get_mongo_client()[MONGODB_DB_NAME]


def get_comments_collection() -> Collection:
    return get_mongo_database()["comments"]
