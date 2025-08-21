from fastapi import APIRouter, Depends, HTTPException, status
from schemas.book import (
     MessageResponse,BookMessageResponse,
     BookCreate,Book,BookUpdate
     )

from utils.auth_utils import (
    get_current_user,
    get_user_repository,
    get_book_repository
    )

from repositories.books import BookRepository
from repositories.auth import UserRepository
from typing import List
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/book", tags=["book"])

@router.post("/create", response_model=BookMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book: BookCreate,
    book_repo: BookRepository = Depends(get_book_repository),
    current_user: dict = Depends(get_current_user)
):
   
    book_data = book.model_dump()
    book_data["author"] = str(current_user["_id"])
    created_book=await book_repo.create_book(book_data)

    return BookMessageResponse(message="Book added successfully",id=created_book["id"])

@router.post("/books", response_model=List[Book])
async def list_books(
    book_repo: BookRepository = Depends(get_book_repository),
    current_user: dict = Depends(get_current_user)
):
    books = await book_repo.list_books(author_id=str(current_user["_id"]))
    return books

@router.get("/books/user/{username}", response_model=List[Book])
async def get_books_by_username(
    username: str,
    book_repo: BookRepository = Depends(get_book_repository),
    user_repo: UserRepository = Depends(get_user_repository)):
    user = await user_repo.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    books = await book_repo.list_books_by_author_id(str(user["_id"]))
    return books


@router.put("/books/{book_id}", response_model=MessageResponse)
async def update_book(
    book_id: str,
    book: BookUpdate,
    book_repo: BookRepository = Depends(get_book_repository),
    current_user: dict = Depends(get_current_user)
):
    existing = await book_repo.get_book_by_id(book_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if existing["author"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    updated = await book_repo.update_book(book_id, book.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update failed")
    return MessageResponse(message="Book updated successfully")

@router.delete("/books/{book_id}", response_model=MessageResponse)
async def delete_book(
    book_id: str,
    book_repo: BookRepository = Depends(get_book_repository),
    current_user: dict = Depends(get_current_user)
):
    existing = await book_repo.get_book_by_id(book_id)
    if not existing:
        return MessageResponse(message="Book not Found", exists=False)
    if existing["author"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    deleted = await book_repo.delete_book(book_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delete failed")
    return MessageResponse(message="Book deleted successfully", exists=True)
