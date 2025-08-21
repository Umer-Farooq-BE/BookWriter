from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = "mongodb://localhost:27017"  
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client["mydatabase"]
def get_collection(collection_name: str):
    return database[collection_name]