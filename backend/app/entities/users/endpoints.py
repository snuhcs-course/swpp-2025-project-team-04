from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from . import crud
from . import schemas


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100):
    return []


@router.get("/{user_id}", response_model=schemas.User)
def read_user(user_id: int):
    return {"id": user_id, "username": "user", "email": "user@example.com"}