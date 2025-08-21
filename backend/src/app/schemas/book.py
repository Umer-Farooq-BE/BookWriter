from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional, List, Dict, Union, Literal
from datetime import datetime


# --- Chapter Models ---

class Part(BaseModel):
    index: int
    content: str
    created_at: datetime = Field(default_factory=datetime.now)


class ChapterBase(BaseModel):
    idx: int
    title: str
    key_points: List[str] = Field(default_factory=list)
    ai_content: Optional[str] = None   # ✅ full concatenated chapter content
    content_parts: List[Part] = Field(default_factory=list)  # ✅ structured parts
    human_edit: Optional[str] = None
    version: int = 1
    updated_at: datetime = Field(default_factory=datetime.now, alias="updatedAt")


class ChapterCreate(ChapterBase):
    pass


class Chapter(ChapterBase):
    class Config:
        from_attributes = True


class SuggestedTitle(BaseModel):
    title: str
    subtitle: str


# --- Book Models ---

class ChatMessage(BaseModel):
    bookId: str
    chapterIndex: int
    partIndex: int
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=datetime.now)


class BookBase(BaseModel):
    user_summary: str
    refined_summary: Optional[str] = None
    suggested_title: Optional[Union[str, List[Dict[str, str]]]] = None
    author: Optional[str] = Field(None, description="User ObjectId as string")
    status: constr(pattern="^(draft|generating|generated|published)$") = "draft"  # type: ignore
    chapters: List[Chapter] = Field(default_factory=list)
    chat_history: List[ChatMessage] = Field(default_factory=list)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    refined_summary: Optional[str] = None
    suggested_title: Optional[List[SuggestedTitle]] = None
    author: Optional[str] = None
    status: Optional[constr(pattern="^(draft|generating|generated|published)$")] = None  # type: ignore
    chapters: Optional[List[Chapter]] = None

    class Config:
        from_attributes = True


class Book(BookBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Generic Message Response ---
class MessageResponse(BaseModel):
    message: str
    exists: bool = False

class BookMessageResponse(BaseModel):
    message: str
    id : str
