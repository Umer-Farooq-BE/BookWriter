from bson import ObjectId
from datetime import datetime
from typing import Optional, List

class BookRepository:
    def __init__(self, collection):
        self.collection = collection

    def _serialize_book(self, book: Optional[dict]) -> Optional[dict]:
        if book is None:
            return None
        
        # Ensure chapters have proper structure
        chapters = []
        for chapter in book.get("chapters", []):
            if chapter is None:
                continue  # Skip None entries
                
            # Ensure chapter has required fields
            if not isinstance(chapter, dict):
                chapter = {"idx": len(chapters), "title": f"Chapter {len(chapters) + 1}"}
            
            # Add missing required fields
            if "idx" not in chapter:
                chapter["idx"] = len(chapters)
            if "title" not in chapter:
                chapter["title"] = f"Chapter {chapter.get('idx', len(chapters)) + 1}"
            if "key_points" not in chapter:
                chapter["key_points"] = []
            if "content_parts" not in chapter:
                chapter["content_parts"] = []
            if "human_edit" not in chapter:
                chapter["human_edit"] = None
            if "version" not in chapter:
                chapter["version"] = 1
            if "updated_at" not in chapter:
                chapter["updated_at"] = book.get("created_at", datetime.now())
            
            chapters.append(chapter)
        
        return {
            "id": str(book["_id"]),
            "user_summary": book.get("user_summary") or book.get("summary", ""),
            "refined_summary": book.get("refined_summary", ""),
            "suggested_title": book.get("suggested_title"),
            "author": book.get("author"),
            "status": book.get("status", "draft"),
            "chapters": chapters,
            "created_at": book.get("created_at"),
            "updated_at": book.get("updated_at"),
        }

    async def create_book(self, book_data: dict) -> dict:
        book_data["created_at"] = datetime.now()
        book_data["updated_at"] = datetime.now()
        result = await self.collection.insert_one(book_data)
        book_data["_id"] = result.inserted_id
        return self._serialize_book(book_data)
    
    async def update_book(self, book_id: str, update_data: dict) -> Optional[dict]:
        update_data["updated_at"] = datetime.now()
        await self.collection.update_one({"_id": ObjectId(book_id)}, {"$set": update_data})
        updated_book = await self.collection.find_one({"_id": ObjectId(book_id)})
        return self._serialize_book(updated_book)

    async def delete_book(self, book_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(book_id)})
        return result.deleted_count > 0
    
    async def get_book_by_id(self, book_id: str) -> Optional[dict]:
        try:
            book = await self.collection.find_one({"_id": ObjectId(book_id)})
            return self._serialize_book(book)
        except Exception:
            return None
        
    async def list_books_by_author_id(self, author_id: str) -> List[dict]:
        """Get all books for a specific author (user)"""
        books = await self.collection.find({"author": author_id}).to_list(length=100)
        return [self._serialize_book(b) for b in books]   

    async def list_books(self, author_id: Optional[str] = None) -> List[dict]:
        query = {"author": author_id} if author_id else {}
        books = await self.collection.find(query).to_list(length=100)
        return [self._serialize_book(b) for b in books if b is not None]

    async def append_chapter_part(self, book_id: str, chapter_index: int, part_doc: dict, key_points: List[str] = None):
        book = await self.collection.find_one({"_id": ObjectId(book_id)})
        if book is None:
            return False
            
        chapters = book.get("chapters", [])
        
        # Ensure chapters list is long enough
        while len(chapters) <= chapter_index:
            chapters.append(None)
        
        # Create new chapter if it doesn't exist or is None
        if chapters[chapter_index] is None:
            new_chapter = {
                "idx": chapter_index,
                "title": part_doc.get("chapter_title", f"Chapter {chapter_index + 1}"),
                "key_points": key_points if key_points else [],  # Save the provided key points
                "ai_content": part_doc.get("content", ""),
                "content_parts": [part_doc],
                "human_edit": None,
                "version": 1,
                "updated_at": datetime.now(),
            }
            chapters[chapter_index] = new_chapter
            
            await self.collection.update_one(
                {"_id": ObjectId(book_id)},
                {"$set": {"chapters": chapters, "updated_at": datetime.now()}}
            )
            return True
        
        # If chapter exists, append part - UPDATE KEY POINTS IF PROVIDED
        current_chapter = chapters[chapter_index]
        current_ai_content = current_chapter.get("ai_content", "")
        new_ai_content = (current_ai_content + " " + part_doc.get("content", "")).strip()
        
        # Ensure content_parts exists
        if "content_parts" not in current_chapter:
            current_chapter["content_parts"] = []
        
        # Use the provided key points or preserve existing ones
        final_key_points = key_points if key_points else current_chapter.get("key_points", [])
        
        # Use $push to append to the content_parts array
        await self.collection.update_one(
            {"_id": ObjectId(book_id)},
            {
                "$push": {f"chapters.{chapter_index}.content_parts": part_doc},
                "$set": {
                    f"chapters.{chapter_index}.ai_content": new_ai_content,
                    f"chapters.{chapter_index}.key_points": final_key_points,  # Update key points
                    f"chapters.{chapter_index}.updated_at": datetime.now(),
                    "updated_at": datetime.now(),
                }
            }
        )
        return True
    
    async def get_book_by_title(self, title: str) -> Optional[dict]:
        book = await self.collection.find_one({"suggested_title": title})
        return self._serialize_book(book)

    # ------------------- Append Chat Message -------------------
    async def append_chat_message(self, book_id: str, message: dict) -> bool:
        try:
            print(f"Appending chat message to book {book_id}: {message}")
            
            # Ensure the message has all required fields
            chat_entry = {
                "bookId": message.get("bookId"),
                "chapterIndex": message.get("chapterIndex"),
                "partIndex": message.get("partIndex"),
                "role": message.get("role"),
                "content": message.get("content"),
                "created_at": message.get("created_at", datetime.now()),
                "timestamp": datetime.now()
            }
            
            print(f"Final chat entry: {chat_entry}")
            
            # First, ensure the book exists and has a chat_history field
            book = await self.collection.find_one({"_id": ObjectId(book_id)})
            if not book:
                print(f"Book {book_id} not found!")
                return False
                
            # If chat_history doesn't exist, initialize it
            if "chat_history" not in book:
                print("chat_history field doesn't exist, initializing...")
                await self.collection.update_one(
                    {"_id": ObjectId(book_id)},
                    {"$set": {"chat_history": []}}
                )
            
            # Now append the message
            result = await self.collection.update_one(
                {"_id": ObjectId(book_id)},
                {
                    "$push": {"chat_history": chat_entry},
                    "$set": {"updated_at": datetime.now()},
                }
            )
            
            print(f"MongoDB update result - matched: {result.matched_count}, modified: {result.modified_count}")
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error in append_chat_message: {e}")
            import traceback
            traceback.print_exc()
            return False