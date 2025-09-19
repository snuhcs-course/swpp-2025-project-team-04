from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..users import crud
from ..users.models import User
from .schemas import SignupRequest, SignupResponse
from ...core.auth import hash_password, create_access_token
from ...core.config import get_db

router = APIRouter()

@router.post("/api/auth/signup/", response_model=SignupResponse, status_code=201)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # username 중복 체크
    if crud.get_user_by_username(db, request.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    # 비밀번호 해싱
    hashed_pw = hash_password(request.password)
    # 유저 생성
    user = crud.create_user(db, request.username, hashed_pw)
    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data)
    refresh_token = create_access_token(data, expires_delta=None)
    return SignupResponse(access_token=access_token, refresh_token=refresh_token)