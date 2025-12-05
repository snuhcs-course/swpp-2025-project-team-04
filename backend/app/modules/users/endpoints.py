from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import List

from . import crud
from . import schemas
from ...core.auth import verify_token, TokenType
from ...core.config import get_db
from ...core.exceptions import (
    InvalidAuthHeaderException,
    UserNotFoundException,
    AuthTokenExpiredException,
    InvalidTokenException,
    InvalidTokenTypeException,
    AppException
)


router = APIRouter(prefix="/user", tags=["user"])

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise InvalidAuthHeaderException()
    
    access_token = authorization[7:]
    
    token_data = verify_token(access_token, TokenType.ACCESS_TOKEN)
    username = token_data["username"]
    
    user = crud.get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()
    
    return user


@router.get("/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100):
    return []


error_responses = AppException.to_openapi_examples([
    InvalidAuthHeaderException,
    UserNotFoundException,
    AuthTokenExpiredException,
    InvalidTokenException,
    InvalidTokenTypeException
])

@router.get("/me", response_model=schemas.User, responses=error_responses)
def get_me(current_user = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=schemas.User)
def read_user(user_id: int):
    return {"id": user_id, "username": "user", "nickname": "user"}


@router.put(
    "/me/interests",
    response_model=schemas.UpdateUserInterestsResponse,
    responses=error_responses,
)
def update_user_interests(
    payload: schemas.UpdateUserInterestsRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = crud.set_user_interests(
        db,
        user_id=current_user.id,
        interest_keys=payload.interests,
    )
    return {"interests": user.interests}
