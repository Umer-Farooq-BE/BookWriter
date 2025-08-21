from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from asyncio import gather

from schemas.auth import (
       UserCreate, UserLogin,
       UserResponse,
       UserInDB,Token,
       TokenItem
    )

from schemas.book import (
      MessageResponse
    )

from utils.auth_utils import (
        verify_password,
        get_password_hash,
        create_access_token,
        create_refresh_token,
        get_current_user,
        get_user_repository,
        decode_refresh_token
        
        )
from repositories.auth import UserRepository

router = APIRouter(prefix="/auth", tags=["authentication"])

# --- Endpoints ---
@router.post("/signup", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository)):
    """Register a new user"""
    username_exists,email_exists = await gather(
        user_repo.check_user_by_username(user_data.username),
        user_repo.get_user_by_email(user_data.email)
        )
    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered")
    if email_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken" )
    user_in_db = UserInDB(email=user_data.email,username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password))
    try:
        await user_repo.create_user(user_in_db.model_dump(by_alias=True))
        return MessageResponse(message="User registered successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=str(e))

@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    user_repo: UserRepository = Depends(get_user_repository)):
    """Authenticate user and return tokens"""

    user = await user_repo.get_user_by_email(user_credentials.email)
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated" )
    await user_repo.update_user_by_email(
        user_credentials.email,
        {"last_login": datetime.now()} )
    token_data = {"user_id": str(user["_id"]), "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return Token(access_token=access_token,refresh_token=refresh_token,token_type="bearer")

@router.post("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    current_user["_id"] = str(current_user["_id"])
    return UserResponse(**current_user)

@router.get("/check_user_by_name", response_model=MessageResponse)
async def check_user_by_name(username: str, user_repo: UserRepository = Depends(get_user_repository)):
    """Check if a user with this username exists"""
    user = await user_repo.get_user_by_username(username)
    if user:
        return MessageResponse(message='Is Exists',exists = True)
    else:
        return MessageResponse(message='Not Exists',exists = False)

@router.post("/refresh-token", response_model=Token)
async def refresh_token(request: TokenItem, user_repo: UserRepository = Depends(get_user_repository)):
    """Refresh the access token using a valid refresh token"""
    try:
        payload = decode_refresh_token(request.refresh_token)
        user_id: str = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        user = await user_repo.get_user_by_id(user_id)
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        token_data = {"user_id": str(user["_id"]), "email": user["email"]}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

@router.post("/logout",response_model=MessageResponse)
async def user_logout(request:TokenItem,user_repo : UserRepository = Depends(get_user_repository)):
    """ Logout the User"""
    try:
        payload= decode_refresh_token(request.refresh_token)
        user_id: str = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        user = await user_repo.get_user_by_id(user_id)
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        await user_repo.update_user_by_id(user_id,{"refresh_token":None})
        return MessageResponse(message="Logged out successfully", exists=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


