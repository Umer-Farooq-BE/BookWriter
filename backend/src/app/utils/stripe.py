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

from schemas.stripe import UserResponse,UserCreate,PaymentRecord,CheckoutSessionRequest,CheckoutSessionResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)

# Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

# MongoDB setup
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.stripe_payments
payments_collection = db.payments
users_collection = db.users



# Stripe utility functions
async def get_stripe_price(price_id: str):
    """Retrieve a Stripe price by ID"""
    try:
        price = stripe.Price.retrieve(price_id)
        return price
    except stripe.error.StripeError as e:
        logger.error(f"Error retrieving Stripe price: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving price: {str(e)}"
        )

async def get_or_create_stripe_customer(email: str):
    """Get or create a Stripe customer by email"""
    try:
        # Check if customer already exists
        customers = stripe.Customer.list(email=email, limit=1)
        if customers and len(customers.data) > 0:
            return customers.data[0]
        
        # Create new customer
        customer = stripe.Customer.create(email=email)
        return customer
        
    except stripe.error.StripeError as e:
        logger.error(f"Error retrieving/creating Stripe customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error with customer: {str(e)}"
        )
    
async def create_checkout_session(stripe_price_id: str, success_url: str, cancel_url: str, customer_email: str, customer: any):
    """Create a Stripe checkout session"""
    try:

        price = stripe.Price.retrieve(stripe_price_id)
        mode = 'subscription' if hasattr(price, 'recurring') and price.recurring else 'payment'
        
        # Prepare session parameters
        session_params = {
            'line_items': [{
                'price': stripe_price_id,
                'quantity': 1,
            }],
            'mode': mode,
            'success_url': success_url,
            'cancel_url': cancel_url,
        }
        
        # Only include customer OR customer_email, not both
        if customer and hasattr(customer, 'id'):
            session_params['customer'] = customer.id
        else:
            session_params['customer_email'] = customer_email
        
        checkout_session = stripe.checkout.Session.create(**session_params)
        return checkout_session
        
    except stripe.error.StripeError as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating checkout session: {str(e)}"
        )
    
async def get_or_create_user(email: str) -> Dict[str, Any]:
    """Get or create a user in our database"""
    try:
        existing_user = await users_collection.find_one({"email": email})
        if existing_user:
            existing_user["id"] = str(existing_user["_id"])
            return existing_user
        
        user_doc = {
            "email": email,
            "name": email.split('@')[0],  # Simple name from email
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "stripe_customer_id": None,  # Will be updated later if needed
            "metadata": {}
        }
        
        result = await users_collection.insert_one(user_doc)
        user = await users_collection.find_one({"_id": result.inserted_id})
        user["id"] = str(user["_id"])
        
        logger.info(f"Created new user: {user['id']}")
        return user
        
    except Exception as e:
        logger.error(f"Error getting/creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error with user management: {str(e)}"
        )


async def get_price_from_product(product_id: str):
    """Get the default price for a Stripe product"""
    try:
        prices = stripe.Price.list(product=product_id, active=True)
        if not prices.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No active prices found for product {product_id}"
            )
        return prices.data[0]
        
    except stripe.error.StripeError as e:
        logger.error(f"Error retrieving prices for product {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving product prices: {str(e)}"
        )


async def get_product_name(product_id: str) -> str:
    """Get product name from Stripe"""
    try:
        product = stripe.Product.retrieve(product_id)
        return product.name
    except stripe.error.StripeError:
        return "Unknown Product"


# Utility Functions
async def save_payment_record(session_data: Dict[str, Any]) -> PaymentRecord:
    """Save payment record to MongoDB"""
    payment_data = {
        "user_id": session_data["metadata"].get("user_id", ""),
        "user_email": session_data["customer_details"]["email"],
        "amount": session_data["amount_total"] / 100,
        "currency": session_data["currency"],
        "status": session_data["payment_status"],
        "stripe_session_id": session_data["id"],
        "stripe_payment_intent_id": session_data.get("payment_intent"),
        "created_at": datetime.fromtimestamp(session_data["created"]),
        "updated_at": datetime.now(),
        "metadata": session_data["metadata"],
        "items": session_data.get("line_items", {}).get("data", []) if session_data.get("line_items") else []
    }
    
    result = await payments_collection.insert_one(payment_data)
    payment_record = await payments_collection.find_one({"_id": result.inserted_id})
    payment_record["id"] = str(payment_record["_id"])
    
    logger.info(f"Payment record saved: {payment_record['id']}")
    return PaymentRecord(**payment_record)

async def update_payment_record(session_id: str, updates: Dict[str, Any]) -> bool:
    """Update payment record in MongoDB"""
    updates["updated_at"] = datetime.now()
    result = await payments_collection.update_one(
        {"stripe_session_id": session_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def get_payment_record(session_id: str) -> Optional[PaymentRecord]:
    """Retrieve payment record from MongoDB"""
    record = await payments_collection.find_one({"stripe_session_id": session_id})
    if record:
        record["id"] = str(record["_id"])
        return PaymentRecord(**record)
    return None

async def get_user_payments(user_id: str) -> List[PaymentRecord]:
    """Get all payments for a user"""
    payments = []
    async for record in payments_collection.find({"user_id": user_id}).sort("created_at", -1):
        record["id"] = str(record["_id"])
        payments.append(PaymentRecord(**record))
    return payments

async def send_confirmation_email(user_email: str, amount: float, order_id: str):
    """Send confirmation email (implement your email service)"""
    logger.info(f"Sending confirmation email to {user_email} for order {order_id}")
    # Simulate async email sending
    await asyncio.sleep(1)