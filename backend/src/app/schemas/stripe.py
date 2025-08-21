import os
import json
import stripe
from fastapi import FastAPI, Request, HTTPException, Depends, status, BackgroundTasks,APIRouter
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
import motor.motor_asyncio
from bson import ObjectId
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    metadata: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

# Pydantic Models
class User(BaseModel):
    id: str
    email: str


class CheckoutSessionResponse(BaseModel):
    success: bool
    code: int
    message: str
    description: Dict[str, Any]

class PaymentRecord(BaseModel):
    id: Optional[str] = None
    user_id: str
    amount: float
    currency: str
    status: str
    stripe_session_id: str
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    items: List[Dict[str, Any]]
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class CheckoutSessionRequest(BaseModel):
    product_id: str = Field(..., description="Stripe Product ID")  
    success_url: str
    cancel_url: str