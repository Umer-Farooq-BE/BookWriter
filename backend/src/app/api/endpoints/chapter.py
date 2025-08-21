from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
from langchain.callbacks.base import AsyncCallbackHandler
from dotenv import load_dotenv
import os
import re
import asyncio
from typing import Optional, List
from datetime import datetime

from repositories.books import BookRepository
from utils.auth_utils import get_book_repository
from schemas.book import ChatMessage

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

router = APIRouter(prefix="/ai", tags=["AI Engine"])

# ---------- Request Schema ----------
class ChapterRequest(BaseModel):
    bookId: str
    bookType: str
    summary: Optional[str]
    title: str
    chapterIndex: int
    chapterTitle: str
    keyPoints: List[str]
    targetWordCount: Optional[int] = None
    partIndex: int
    previousParts: Optional[List[str]] = None

# ---------- Helpers ----------
def get_words_per_part(book_type: str) -> int:
    return {
        "Ebook": 700,
        "Short Book": 1000,
        "Full Length Book": 1500,
    }.get(book_type, 1000)

def count_words(text: str) -> int:
    if not text or not isinstance(text, str):
        return 0
    clean_text = re.sub(r"\*\*|#+", "", text).strip()
    words = clean_text.split()
    return len(words) if words else 0

def build_context_prompt(previous_parts: Optional[List[str]], chapter_title: str, part_index: int) -> str:
    if not previous_parts:
        return ""

    summaries = [
        f"Part {i+1} summary: {part[:400]}..."
        for i, part in enumerate(previous_parts)
    ]

    return f"""
The following summarizes earlier parts of the chapter *"{chapter_title}"*:

{chr(10).join(summaries)}

Now write Part {part_index + 1}. 
Continue naturally, ensuring smooth transitions.
Do NOT repeat or rephrase earlier sections — build upon them.
"""

# ---------- Streaming Callback ----------
class StreamHandler(AsyncCallbackHandler):
    def __init__(self, controller: asyncio.Queue, repo: BookRepository, req: ChapterRequest):
        self.controller = controller
        self.content = ""
        self.repo = repo
        self.req = req

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.content += token
        current_word_count = count_words(self.content)
        if current_word_count % 200 == 0 and current_word_count > 0:
            print(f"Progress: {current_word_count} words")
        await self.controller.put(f"data: {token}\n\n")

    async def on_llm_end(self, *args, **kwargs):
        try:
            part_doc = {
                "index": self.req.partIndex,
                "content": self.content,
                "created_at": datetime.now(),
            }
            await self.repo.append_chapter_part(
                self.req.bookId,
                self.req.chapterIndex,
                part_doc,
                self.req.keyPoints
            )
            print(f"Saved part {self.req.partIndex} of chapter {self.req.chapterIndex}")
            message = ChatMessage(
                bookId=self.req.bookId,
                chapterIndex=self.req.chapterIndex,
                partIndex=self.req.partIndex,
                role="assistant",
                content=self.content,
                created_at=datetime.now(),
            )
            print(f"Attempting to save chat message: {message.model_dump()}")

            await self.repo.append_chat_message(self.req.bookId, message.model_dump())
            print(f"Saved assistant message for chapter {self.req.chapterIndex}, part {self.req.partIndex}")
        except Exception as e:
            print(f"Error saving to database: {e}")
        final_word_count = count_words(self.content)
        print(f"Final word count: {final_word_count}")
        await self.controller.put("event: done\n\n")
        await self.controller.put(None)

# ---------- Endpoint ----------
@router.post("/generate-chapter")
async def generate_chapter(
    req: ChapterRequest, 
    repo: BookRepository = Depends(get_book_repository)
):
    try:
        print(f"Starting generation for book {req.bookId}, chapter {req.chapterIndex}, part {req.partIndex}")

        words_per_part = req.targetWordCount or get_words_per_part(req.bookType)
        context_prompt = build_context_prompt(req.previousParts, req.chapterTitle, req.partIndex)

        base_prompt = """
You are an experienced professional book author. 
Write engaging, clear, and educational prose that flows naturally.
"""

        # Slice key points
        if req.keyPoints:
            total_parts = 4
            slice_start = int((req.partIndex / total_parts) * len(req.keyPoints))
            slice_end = int(((req.partIndex + 1) / total_parts) * len(req.keyPoints))
            relevant_key_points = req.keyPoints[slice_start:slice_end]
            kp_text = ", ".join(relevant_key_points) if relevant_key_points else "No specific key points for this part"
        else:
            kp_text = "No specific key points provided"

        prompt = base_prompt + context_prompt + f"""
Write **Part {req.partIndex + 1}** of **Chapter {req.chapterIndex}** titled *"{req.chapterTitle}"* 
for the book *"{req.title}"*.

### Book Summary:
{req.summary}

### Requirements:
- Length: At least {words_per_part} words
- Focus on these key points: {kp_text}
- Ensure smooth transitions with previous parts
- Maintain professional, clear, and educational tone
- Use structured paragraphs with detailed explanations
- Provide depth with examples, case studies, and thorough analysis
- Avoid repeating or summarizing earlier parts
- Write comprehensive content that meets the word count target
- Do not include personal opinions or first-person narratives
"""

        queue: asyncio.Queue = asyncio.Queue()

        model = ChatOpenAI(
            model="gpt-4o",
            temperature=0.4,
            streaming=True,
            openai_api_key=OPENAI_API_KEY,
            callbacks=[StreamHandler(queue, repo, req)]
        )

        async def streamer():
            try:
                while True:
                    item = await queue.get()
                    if item is None:
                        break
                    yield item.encode("utf-8")
            except asyncio.CancelledError:
                print("Streaming connection closed by client")
            except Exception as e:
                print(f"Streaming error: {e}")

        asyncio.create_task(model.ainvoke([HumanMessage(content=prompt)]))

        return StreamingResponse(
            streamer(),
            media_type="text/event-stream",
            headers={
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except Exception as e:
        print(f"Error in generate-chapter: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
