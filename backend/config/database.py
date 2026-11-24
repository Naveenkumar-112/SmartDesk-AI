import os
import certifi
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

client = None
db = None


def connect_db():
    global client, db

    try:
        mongodb_uri = os.getenv("MONGODB_URI")

        if not mongodb_uri:
            raise ValueError("MONGODB_URI not found in .env")

        client = MongoClient(
            mongodb_uri,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            retryWrites=True
        )

        client.admin.command("ping")

        db = client.get_default_database()

        print("=================================")
        print("MongoDB Connected Successfully!")
        print("Database:", db.name)
        print("=================================")

        return db

    except Exception as error:
        print("MongoDB Connection Failed:", error)
        raise


def get_db():
    if db is None:
        raise RuntimeError("Database is not connected")

    return db