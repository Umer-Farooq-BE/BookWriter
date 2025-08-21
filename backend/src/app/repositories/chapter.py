from typing import Optional
from bson import ObjectId
from datetime import datetime
from typing import Optional,List,Dict
from bson import ObjectId
from datetime import datetime

class ChapterRepository:
    def __init__(self, collection):
        """
        Initialize the repository with a Motor collection.
        """
        self.collection = collection

    # ------------------- Get Book -------------------
    async def get_book_by_id(self, book_id: str) -> Optional[dict]:
        """Retrieve a book by MongoDB ObjectId."""
        try:
            return await self.collection.find_one({"_id": ObjectId(book_id)})
        except Exception:
            return None

    # ------------------- Update Chat State -------------------
    async def update_chat_state(self, book_id: str, state: dict) -> Optional[dict]:
        """Update chat state for a book."""
        state["updated_at"] = datetime.now()
        try:
            await self.collection.update_one(
                {"_id": ObjectId(book_id)},
                {"$set": {"chatState": state}}
            )
            return await self.get_book_by_id(book_id)
        except Exception:
            return None

    # ------------------- Append Chapter Part -------------------
    # ------------------- Append Chapter Part -------------------
    async def append_chapter_part(
    self, book_id: str, chapter_index: int, part_index: int, content: str
) -> Optional[dict]:
        """Append or update a generated part inside a chapter."""
        try:
            print(f"[DEBUG] append_chapter_part called with book_id={book_id}, chapter_index={chapter_index}, part_index={part_index}")

            # Validate ObjectId
            try:
                oid = ObjectId(book_id)
            except Exception as e:
                print(f"[ERROR] Invalid bookId: {book_id} -> {e}")
                return None

            book = await self.get_book_by_id(book_id)
            if not book:
                print(f"[ERROR] No book found with _id={book_id}")
                return None

            print(f"[DEBUG] Book retrieved: keys={list(book.keys())}")

            chapters = book.get("chapters", [])
            print(f"[DEBUG] Existing chapters count: {len(chapters)}")

            # Try to find chapter
            chapter = next((ch for ch in chapters if ch.get("idx") == chapter_index), None)

            if chapter:
                print(f"[DEBUG] Found existing chapter idx={chapter_index}")
                existing_content = chapter.get("ai_content", "")
                new_content = (existing_content + "\n\n" + content).strip()
                chapter["ai_content"] = new_content
                chapter["updatedAt"] = datetime.now()
            else:
                print(f"[DEBUG] Chapter idx={chapter_index} not found, creating new one")
                chapters.append({
                    "idx": chapter_index,
                    "title": f"Chapter {chapter_index+1}",
                    "key_points": [],
                    "ai_content": content,
                    "humanEdit": None,
                    "version": 1,
                    "updatedAt": datetime.now(),
                })

            # Perform update
            result = await self.collection.update_one(
                {"_id": oid},
                {"$set": {"chapters": chapters}}
            )
            print(f"[DEBUG] update_one result: matched={result.matched_count}, modified={result.modified_count}")

            # Fetch back and return
            updated_book = await self.get_book_by_id(book_id)
            if updated_book:
                print(f"[DEBUG] Book successfully updated. Chapter count now: {len(updated_book.get('chapters', []))}")
            else:
                print("[ERROR] Book not found after update")

            return updated_book

        except Exception as e:
            print("[EXCEPTION in append_chapter_part]", e)
            import traceback
            traceback.print_exc()
            return None


    # ------------------- Upsert Full Chapter -------------------
    async def upsert_chapter(
        self, book_id: str, chapter_index: int, title: str, key_points: list, ai_content: str
    ) -> Optional[dict]:
        """Insert or update a full chapter with its metadata + ai_content."""
        try:
            book = await self.get_book_by_id(book_id)
            if not book:
                return None

            chapters = book.get("chapters", [])
            existing_index = next((i for i, ch in enumerate(chapters) if ch.get("idx") == chapter_index), -1)

            if existing_index != -1:
                # Update existing
                chapters[existing_index].update({
                    "idx": chapter_index,
                    "title": title,
                    "key_points": key_points or [],
                    "ai_content": ai_content,
                    "updatedAt": datetime.now(),
                })
            else:
                # Add new
                chapters.append({
                    "idx": chapter_index,
                    "title": title,
                    "key_points": key_points or [],
                    "ai_content": ai_content,
                    "humanEdit": None,
                    "version": 1,
                    "updatedAt": datetime.now(),
                })

            # Update status
            status = "generated"
            if book.get("chapterCount") and len(chapters) < book["chapterCount"]:
                status = "generating"

            await self.collection.update_one(
                {"_id": ObjectId(book_id)},
                {"$set": {"chapters": chapters, "status": status}}
            )
            return await self.get_book_by_id(book_id)

        except Exception as e:
            print("upsert_chapter error:", e)
            return None
    
     # ------------------- Append Single Chat Message -------------------
    async def append_chat_message(self, book_id: str, message: dict) -> Optional[dict]:
        """
        Append a chat message (user/assistant) to book.chatHistory array.
        Example message = {
            "role": "user" / "assistant",
            "content": "Hello",
            "createdAt": datetime.now()
        }
        """
        message["createdAt"] = datetime.now()
        try:
            await self.collection.update_one(
                {"_id": ObjectId(book_id)},
                {"$push": {"chatHistory": message}}
            )
            return await self.get_book_by_id(book_id)
        except Exception as e:
            print("append_chat_message error:", e)
            return None

    # ------------------- Get Chat History -------------------
    async def get_chat_history(self, book_id: str) -> List[Dict]:
        """Retrieve all messages for a book."""
        try:
            book = await self.get_book_by_id(book_id)
            return book.get("chatHistory", []) if book else []
        except Exception as e:
            print("get_chat_history error:", e)
            return []
