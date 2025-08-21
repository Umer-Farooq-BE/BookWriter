from pydantic import BaseModel, EmailStr, Field
from typing import Optional,List,Any
from datetime import datetime
from bson import ObjectId

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None


# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        populate_by_name = True
        from_attributes = True

class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    last_login: Optional[datetime] = None
    
class TokenItem(BaseModel):
    refresh_token: str