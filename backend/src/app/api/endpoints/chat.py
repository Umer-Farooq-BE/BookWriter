from fastapi import APIRouter, HTTPException, Query,Depends
from pydantic import BaseModel
from typing import Optional, Any, Dict,List
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
from schemas.book import ChatMessage

from db.db_config import get_collection

router = APIRouter(prefix="/books/chat-state", tags=["Chat State"])

# ---------- Pydantic Models ----------
class ChatStateUpdate(BaseModel):
    bookId: str
    state: Dict[str, Any]

class ChatStateResponse(BaseModel):
    data: Optional[List[ChatMessage]] = None

# ---------- Repository Layer ----------
class BookRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def find_book_by_id(self, book_id: str) -> Optional[Dict]:
        try:
            return await self.collection.find_one({"_id": ObjectId(book_id)})
        except Exception:
            return None

    async def update_chat_state(self, book_id: str, state: Dict[str, Any]) -> Optional[Dict]:
        try:
            chat_history = state.get("chatHistory", [])
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(book_id)},
                {"$set": {"chatHistory": chat_history, "updatedAt": datetime.now()}},
                return_document=True )
            return result
        except Exception as e:
            print(f"Error updating chat state: {e}")
            return None

# ---------- Dependency Injection ----------
async def get_book_repository() -> BookRepository:
    collection = get_collection("books")
    return BookRepository(collection)

# ---------- API Endpoints ----------
@router.get("/", response_model=ChatStateResponse)
async def get_chat_state(
    bookId: str = Query(..., description="The ID of the book"),
    repo: BookRepository = Depends(get_book_repository)):
    """
    Get the chat state for a specific book
    """
    if not bookId:
        raise HTTPException(status_code=400, detail="bookId is required")
    try:
        book = await repo.find_book_by_id(bookId)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        chat_state = book.get("chatHistory")
        print("*******",chat_state)
        messages = [ChatMessage(bookId=bookId, **msg) for msg in chat_state]
        return ChatStateResponse(data=messages)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting chat state: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@router.put("/", response_model=ChatStateResponse)
async def update_chat_state(
    update_data: ChatStateUpdate,
    repo: BookRepository = Depends(get_book_repository)):
    if not update_data.bookId:
        raise HTTPException(status_code=400, detail="bookId is required")
    try:
        book = await repo.find_book_by_id(update_data.bookId)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        updated_book = await repo.update_chat_state(update_data.bookId, update_data.state)
        if not updated_book:
            raise HTTPException(status_code=500, detail="Failed to update chat state")
        chat_history = updated_book.get("chatHistory", [])
        for msg in chat_history:
            msg["bookId"] = update_data.bookId  
        return ChatStateResponse(data=chat_history)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating chat state: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/")
async def delete_chat_state(
    bookId: str = Query(..., description="The ID of the book"),
    repo: BookRepository = Depends(get_book_repository)):
    """
    Delete the chat state for a specific book
    """
    if not bookId:
        raise HTTPException(status_code=400, detail="bookId is required")
    try:
        result = await repo.collection.update_one(
            {"_id": ObjectId(bookId)},
            {"$unset": {"chatHistory": ""}})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Book not found or no chat state to delete")
        return {"message": "Chat state deleted successfully"}
    except Exception as e:
        print(f"Error deleting chat state: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")