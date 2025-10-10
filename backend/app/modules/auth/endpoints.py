from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..users.crud import create_user
from .schemas import SignupRequest, SignupResponse, LoginRequest, LoginResponse, RefreshTokenRequest, AccessTokenResponse,RefreshTokenResponse, DeleteAccountResponse
from ...core.auth import hash_password, create_access_token, verify_password, verify_token, TokenType
from ...core.config import get_db
from ..users.crud import get_user_by_username, delete_user
from ...core.exceptions import (
    AppException,
    UserNotFoundException, 
    InvalidCredentialsException, 
    UsernameExistsException,
    AuthTokenExpiredException,
    InvalidAuthHeaderException,
    AccountDeletionFailedException,
    InvalidTokenException,
    InvalidTokenTypeException,
    InvalidUsernameFormatException,
    InvalidPasswordFormatException
)
router = APIRouter(prefix="/auth", tags=["auth"])



@router.post("/signup", response_model=SignupResponse, status_code=201, 
            responses=AppException.to_openapi_examples([
                UsernameExistsException,
                InvalidUsernameFormatException,
                InvalidPasswordFormatException
            ]))
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # username 중복 체크
    if get_user_by_username(db, request.username):
        raise UsernameExistsException()
    # 비밀번호 해싱
    hashed_pw = hash_password(request.password)
    # 유저 생성
    nickname = request.nickname if request.nickname.strip() else request.username
    user = create_user(db, request.username, hashed_pw, nickname)
    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data, TokenType.ACCESS_TOKEN)
    refresh_token = create_access_token(data, TokenType.REFRESH_TOKEN)
    return SignupResponse(
        access_token=access_token, 
        refresh_token=refresh_token,
        user={"id": user.id, "username": user.username, "nickname": user.nickname}
    )


@router.post("/login", response_model=LoginResponse, 
            responses=AppException.to_openapi_examples([
                UserNotFoundException,
                InvalidCredentialsException,
                InvalidUsernameFormatException,
                InvalidPasswordFormatException
            ]))
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 사용자 조회
    user = get_user_by_username(db, request.username)
    if not user:
        raise InvalidCredentialsException()
    
    # 비밀번호 검증
    if not verify_password(request.password, user.hashed_password):
        raise InvalidCredentialsException()
    
    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data, TokenType.ACCESS_TOKEN)
    refresh_token = create_access_token(data, TokenType.REFRESH_TOKEN)
    
    return LoginResponse(
        access_token=access_token, 
        refresh_token=refresh_token,
        user={"id": user.id, "username": user.username, "nickname": user.nickname}
    )


@router.post("/refresh/access", response_model=AccessTokenResponse, 
            responses=AppException.to_openapi_examples([
                UserNotFoundException,
                AuthTokenExpiredException,
                InvalidTokenException,
                InvalidTokenTypeException
            ]))
def reissue_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    # refresh token 검증
    token_data = verify_token(request.refresh_token, TokenType.REFRESH_TOKEN)
    username = token_data["username"]
    
    user = get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()
    
    # 새로운 access token 생성
    data = {"sub": user.username}
    new_access_token = create_access_token(data, TokenType.ACCESS_TOKEN)
    
    return AccessTokenResponse(access_token=new_access_token)




@router.delete("/delete-account", response_model=DeleteAccountResponse,
                responses=AppException.to_openapi_examples([
                    InvalidAuthHeaderException,
                    UserNotFoundException,
                    AuthTokenExpiredException,
                    InvalidTokenException,
                    InvalidTokenTypeException,
                    AccountDeletionFailedException
                ]))
def delete_account(authorization: str = Header(), db: Session = Depends(get_db)):
    # Bearer 토큰에서 access token 추출
    if not authorization.startswith("Bearer "):
        raise InvalidAuthHeaderException()
    
    access_token = authorization[7:]
    
    # 토큰 검증
    token_data = verify_token(access_token, TokenType.ACCESS_TOKEN)
    username = token_data["username"]
    
    # 사용자 조회
    user = get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()
    
    # 계정 삭제
    if delete_user(db, username):
        return DeleteAccountResponse(message="Account deleted successfully")
    else:
        raise AccountDeletionFailedException()

