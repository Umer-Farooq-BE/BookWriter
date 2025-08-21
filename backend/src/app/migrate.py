async def migrate_books_data(self):
    """Fix existing books with malformed chapters data"""
    async for book in self.collection.find({"chapters": {"$exists": True}}):
        if not book.get("chapters"):
            continue
            
        fixed_chapters = []
        for i, chapter in enumerate(book["chapters"]):
            if chapter is None:
                # Create empty chapter structure
                fixed_chapters.append({
                    "idx": i,
                    "title": f"Chapter {i + 1}",
                    "key_points": [],
                    "ai_content": "",
                    "content_parts": [],
                    "human_edit": None,
                    "version": 1,
                    "updated_at": book.get("created_at", datetime.now())
                })
            elif isinstance(chapter, dict):
                # Ensure all required fields exist
                fixed_chapter = {
                    "idx": chapter.get("idx", i),
                    "title": chapter.get("title", f"Chapter {i + 1}"),
                    "key_points": chapter.get("key_points", []),
                    "ai_content": chapter.get("ai_content", ""),
                    "content_parts": chapter.get("content_parts", []),
                    "human_edit": chapter.get("human_edit"),
                    "version": chapter.get("version", 1),
                    "updated_at": chapter.get("updated_at", book.get("created_at", datetime.now()))
                }
                fixed_chapters.append(fixed_chapter)
        
        # Update the book with fixed chapters
        await self.collection.update_one(
            {"_id": book["_id"]},
            {"$set": {"chapters": fixed_chapters}}
        )