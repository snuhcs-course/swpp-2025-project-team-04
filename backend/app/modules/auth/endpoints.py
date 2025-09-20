from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..users.crud import create_user
from .schemas import SignupRequest, SignupResponse
from ...core.auth import hash_password, create_access_token
from ...core.config import get_db
from datetime import timedelta
from ..users.crud import get_user_by_username

router = APIRouter()

@router.post("/api/auth/signup/", response_model=SignupResponse, status_code=201)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # username 중복 체크
    if get_user_by_username(db, request.username):
        raise HTTPException(status_code=400, detail="username already exists.")
    # 비밀번호 해싱
    hashed_pw = hash_password(request.password)
    # 유저 생성
    user = create_user(db, request.username, hashed_pw)
    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data, expires_delta=timedelta(minutes=30))
    refresh_token = create_access_token(data, expires_delta=timedelta(days=7))
    return SignupResponse(access_token=access_token, refresh_token=refresh_token)