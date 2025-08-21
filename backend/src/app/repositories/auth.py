from typing import Optional
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from datetime import datetime

class UserRepository:
    def __init__(self, collection):
        """
        Initialize the repository with a Motor collection.
        """
        self.collection = collection
    # ------------------- Create User -------------------
    async def create_user(self, user_data: dict) -> dict:
        """Insert a new user into the collection."""
        try:
            result = await self.collection.insert_one(user_data)
            user_data["_id"] = result.inserted_id
            return user_data
        except DuplicateKeyError as e:
            if "email" in str(e):
                raise ValueError("Email already registered")
            elif "username" in str(e):
                raise ValueError("Username already taken")
            else:
                raise ValueError("User already exists")

    # ------------------- Get User -------------------
    async def get_user_by_email(self, email: str, include_password: bool = True) -> Optional[dict]:
        """Retrieve a user by email."""
        projection = None if include_password else {"hashed_password": 0}
        return await self.collection.find_one({"email": email}, projection)

    async def check_user_by_username(self, username: str, include_password: bool = True) -> Optional[dict]:
        """Retrieve a user by username."""
        projection = None if include_password else {"hashed_password": 0}
        return await self.collection.find_one({"username": username}, projection)

    async def get_user_by_id(self, user_id: str, include_password: bool = True) -> Optional[dict]:
        """Retrieve a user by MongoDB ObjectId."""
        try:
            projection = None if include_password else {"hashed_password": 0}
            return await self.collection.find_one({"_id": ObjectId(user_id)}, projection)
        except Exception:
            return None
        
    async def get_user_by_username(self, username: str, include_password: bool = True) -> Optional[dict]:
        """Retrieve a user by MongoDB ObjectId."""
        try:
            projection = None if include_password else {"hashed_password": 0}
            return await self.collection.find_one({"username": username}, projection)
        except Exception:
            return None

    # ------------------- Update User -------------------
    async def update_user_by_email(self, email: str, update_data: dict) -> Optional[dict]:
        """Update user fields by email and return the updated document."""
        update_data["updated_at"] = datetime.now()
        result = await self.collection.update_one(
            {"email": email},
            {"$set": update_data}
        )
        if result.modified_count:
            return await self.get_user_by_email(email)
        return None

    async def update_user_by_id(self, user_id: str, update_data: dict) -> Optional[dict]:
        """Update user fields by ID and return the updated document."""
        update_data["updated_at"] = datetime.now()
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            if result.modified_count:
                return await self.get_user_by_id(user_id)
            return None
        except Exception:
            return None