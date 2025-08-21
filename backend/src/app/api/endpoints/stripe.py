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

app = ()

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

# Pydantic Models
class CheckoutRequest(BaseModel):
    price: float = Field(..., gt=0, description="Price in USD")
    user_id: str = Field(..., description="User ID")
    user_email: EmailStr = Field(..., description="User email")
    product_name: str = Field("Premium Service", description="Product name")
    quantity: int = Field(1, ge=1, description="Quantity")
    metadata: Optional[Dict[str, Any]] = None

class PaymentSuccessResponse(BaseModel):
    session_id: str
    url: str
    message: str = "Checkout session created successfully"

class PaymentRecord(BaseModel):
    id: Optional[str] = None
    user_id: str
    user_email: str
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

async def create_user(user_data: UserCreate) -> UserResponse:
    """Create a new user in MongoDB"""
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "created_at": datetime.now(),
        "metadata": user_data.metadata or {}
    }
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        existing_user["id"] = str(existing_user["_id"])
        return UserResponse(**existing_user)
    
    result = await users_collection.insert_one(user_doc)
    user = await users_collection.find_one({"_id": result.inserted_id})
    user["id"] = str(user["_id"])
    return UserResponse(**user)

async def send_confirmation_email(user_email: str, amount: float, order_id: str):
    """Send confirmation email (implement your email service)"""
    logger.info(f"Sending confirmation email to {user_email} for order {order_id}")
    # Simulate async email sending
    await asyncio.sleep(1)





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
    user_email: str
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
        # Determine mode based on price type
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


class CheckoutSessionRequest(BaseModel):
    customer_email: EmailStr
    product_id: str = Field(..., description="Stripe Product ID")  # Changed from price_id to product_id
    success_url: str
    cancel_url: str

# Update the utility function to get price from product
async def get_price_from_product(product_id: str):
    """Get the default price for a Stripe product"""
    try:
        # Get all active prices for this product
        prices = stripe.Price.list(product=product_id, active=True)
        
        if not prices.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No active prices found for product {product_id}"
            )
        
        # Return the first active price (you might want more logic here if you have multiple prices)
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
    
# Update the route to use product_id instead of price_id
@app.post("/checkout-session/", response_model=CheckoutSessionResponse)
async def create_checkout_session_api(
    request: CheckoutSessionRequest,
):
    """
    Create a Stripe checkout session using Product ID
    """
    try:
        # Get or create user in our database
        user = await get_or_create_user(request.customer_email)
        
        # Get the price for the specified product
        stripe_price = await get_price_from_product(request.product_id)
        
        # Get or create Stripe customer
        customer = await get_or_create_stripe_customer(request.customer_email)
        
        # Create checkout session
        checkout_session = await create_checkout_session(
            stripe_price_id=stripe_price.id,  # Use the price ID, not product ID
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=request.customer_email,
            customer=customer
        )
        
        # Determine payment type
        is_subscription = hasattr(stripe_price, 'recurring') and stripe_price.recurring
        payment_type = "subscription" if is_subscription else "one_time"
        
        # Calculate amount
        amount = stripe_price.unit_amount / 100 if hasattr(stripe_price, 'unit_amount') else 0
        
        # Save to database with user reference
        payment_data = {
            "stripe_session_id": checkout_session.id,
            "user_id": user["id"],
            "user_email": request.customer_email,
            "product_id": request.product_id,
            "price_id": stripe_price.id,
            "amount": amount,
            "currency": stripe_price.currency if hasattr(stripe_price, 'currency') else "usd",
            "status": "pending",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "type": payment_type,
            "metadata": {
                "user_id": user["id"],
                "user_email": request.customer_email,
                "product_name": await get_product_name(request.product_id)  # Added product name
            }
        }
        
        await payments_collection.insert_one(payment_data)
        
        logger.info(f"Created checkout session {checkout_session.id} for user {user['id']}")
        
        return CheckoutSessionResponse(
            success=True,
            code=201,
            message="checkout session created",
            description={
                "session_id": checkout_session.id,
                "session_url": checkout_session.url,
                "user_id": user["id"],
                "product_id": request.product_id,
                "price_id": stripe_price.id,
                "amount": amount,
                "currency": stripe_price.currency if hasattr(stripe_price, 'currency') else "usd",
                "type": payment_type
            }
        )
        
    except HTTPException as he:
        raise he
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )



@app.get("/success/")
async def payment_success(session_id: str):
    """Handle successful payment redirect"""
    try:
        # Verify the session was successful
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid":
            # Update payment record in database
            await update_payment_record(session_id, {
                "status": "completed",
                "stripe_payment_intent_id": session.payment_intent,
                "amount": session.amount_total / 100
            })
            
            return JSONResponse(
                content={
                    "message": "Payment successful!",
                    "session_id": session_id,
                    "amount": session.amount_total / 100,
                    "currency": session.currency.upper()
                }
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Payment not completed"}
            )
            
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error verifying payment: {str(e)}"
        )

@app.get("/cancel/")
async def payment_cancel():
    """Handle cancelled payment"""
    return JSONResponse(
        content={"message": "Payment cancelled. You can try again."}
    )

@app.post("/webhook/")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not WEBHOOK_SECRET:
        logger.error("WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    logger.info(f"Received event: {event['type']}")

    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        background_tasks.add_task(handle_checkout_session_completed, event)
    elif event['type'] == 'payment_intent.succeeded':
        background_tasks.add_task(handle_payment_intent_succeeded, event)
    elif event['type'] == 'payment_intent.payment_failed':
        background_tasks.add_task(handle_payment_failed, event)

    return {"status": "success"}

async def handle_checkout_session_completed(event):
    """Handle completed checkout session"""
    session = event['data']['object']
    
    try:
        # Expand the session to get line items
        expanded_session = stripe.checkout.Session.retrieve(
            session['id'],
            expand=['line_items']
        )
        
        # Save payment record
        payment_record = await save_payment_record(expanded_session)
        
        # Send confirmation email
        await send_confirmation_email(
            user_email=session['customer_details']['email'],
            amount=session['amount_total'] / 100,
            order_id=session['id']
        )
        
        logger.info(f"Processed successful payment: {session['id']}")
        
    except Exception as e:
        logger.error(f"Error processing completed session: {str(e)}")

async def handle_payment_intent_succeeded(event):
    """Handle successful payment intent"""
    payment_intent = event['data']['object']
    
    # Find the session associated with this payment intent
    session = stripe.checkout.Session.list(
        payment_intent=payment_intent['id'],
        limit=1
    ).data[0] if stripe.checkout.Session.list(payment_intent=payment_intent['id'], limit=1).data else None
    
    if session:
        await update_payment_record(session['id'], {
            "status": "completed",
            "stripe_payment_intent_id": payment_intent['id']
        })
    
    logger.info(f"Payment intent succeeded: {payment_intent['id']}")

async def handle_payment_failed(event):
    """Handle failed payment"""
    payment_intent = event['data']['object']
    
    # Find the session associated with this payment intent
    session = stripe.checkout.Session.list(
        payment_intent=payment_intent['id'],
        limit=1
    ).data[0] if stripe.checkout.Session.list(payment_intent=payment_intent['id'], limit=1).data else None
    
    if session:
        await update_payment_record(session['id'], {
            "status": "failed"
        })
    
    logger.warning(f"Payment failed: {payment_intent['id']}")

@app.get("/payments/{session_id}", response_model=PaymentRecord)
async def get_payment_status(session_id: str):
    """Get payment status by session ID"""
    record = await get_payment_record(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return record

@app.get("/users/{user_id}/payments", response_model=List[PaymentRecord])
async def get_user_payment_history(user_id: str):
    """Get all payments for a specific user"""
    payments = await get_user_payments(user_id)
    return payments

@app.post("/users/", response_model=UserResponse)
async def create_new_user(user_data: UserCreate):
    """Create a new user"""
    try:
        user = await create_user(user_data)
        return user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )
