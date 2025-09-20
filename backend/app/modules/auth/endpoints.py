from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..users.crud import create_user
from .schemas import SignupRequest, SignupResponse, LoginRequest, LoginResponse, RefreshTokenRequest, AccessTokenResponse,RefreshTokenResponse, LogoutRequest, LogoutResponse
from ...core.auth import hash_password, create_access_token, verify_password, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES,REFRESH_TOKEN_EXPIRE_DAYS, add_token_to_blocklist
from ...core.config import get_db
from datetime import timedelta
from ..users.crud import get_user_by_username

router = APIRouter(prefix="/auth", tags=["auth"])



@router.post("/signup", response_model=SignupResponse, status_code=201)
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
    access_token = create_access_token(data, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_access_token(data, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    return SignupResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 사용자 조회
    user = get_user_by_username(db, request.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # 비밀번호 검증
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_access_token(data, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    return LoginResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/reissue/access", response_model=AccessTokenResponse)
def reissue_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    # refresh token 검증
    token_data = verify_token(request.refresh_token)
    username = token_data["username"]
    
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    
    # 새로운 access token 생성
    data = {"sub": user.username}
    new_access_token = create_access_token(data, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    return AccessTokenResponse(access_token=new_access_token)




@router.post("/reissue/refresh", response_model=RefreshTokenResponse)
def reissue_refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    # refresh token 검증
    token_data = verify_token(request.refresh_token)
    username = token_data["username"]
    
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    
    # 새로운 refresh token 생성
    data = {"sub": user.username}
    new_refresh_token = create_access_token(data, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    return RefreshTokenResponse(refresh_token=new_refresh_token)


@router.post("/logout", response_model=LogoutResponse)
def logout(request: LogoutRequest):
    # Add both tokens to blocklist
    add_token_to_blocklist(request.access_token)
    add_token_to_blocklist(request.refresh_token)
    
    return LogoutResponse(message="Successfully logged out")

