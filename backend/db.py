# backend/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import time

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

def verify_mongo_connection():
    """Connects to Mongo with exponential backoff for K8s startup."""
    max_retries = 5
    for i in range(max_retries):
        try:
            # Use sync client for initialization check
            check_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
            check_client.admin.command('ping')
            print("Successfully verified database connection.")
            return True
        except ConnectionFailure:
            wait_time = 2 ** i
            print(f"Database verification failed. Retrying in {wait_time}s... (Attempt {i+1}/{max_retries})")
            time.sleep(wait_time)
    
    raise Exception("Could not verify database connection after multiple attempts.")

# Block until Mongo is ready (K8s resilience)
verify_mongo_connection()

client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
db = client.trajectory_sim

replays = db.replays
missions = db.missions
