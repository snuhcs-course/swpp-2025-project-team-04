from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ...core.auth import (
    TokenType,
    create_access_token,
    hash_password,
    verify_password,
    verify_token,
)
from ...core.config import get_db
from ...core.exceptions import (
    AccountDeletionFailedException,
    AppException,
    AuthTokenExpiredException,
    InvalidAuthHeaderException,
    InvalidCredentialsException,
    InvalidPasswordFormatException,
    InvalidTokenException,
    InvalidTokenTypeException,
    UserNotFoundException,
    UsernameExistsException,
)
from ..users.crud import create_user, delete_user, get_user_by_username, update_user_password
from .schemas import (
    AccessTokenResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    SignupRequest,
    SignupResponse,
)
from ..users.schemas import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=201,
    responses=AppException.to_openapi_examples(
        [
            UsernameExistsException,
        ]
    ),
)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if get_user_by_username(db, request.username):
        raise UsernameExistsException()
    # 비밀번호 해싱
    hashed_pw = hash_password(request.password)
    # 유저 생성
    nickname = (request.nickname or "").strip() or request.username
    user = create_user(db, request.username, hashed_pw, nickname)
    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data, TokenType.ACCESS_TOKEN)
    refresh_token = create_access_token(data, TokenType.REFRESH_TOKEN)
    return SignupResponse(
        access_token=access_token, 
        refresh_token=refresh_token,
        user=User.from_orm(user)
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    responses=AppException.to_openapi_examples(
        [
            UserNotFoundException,
            InvalidCredentialsException,
        ]
    ),
)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_username(db, request.username)
    if not user:
        raise InvalidCredentialsException()

    if not verify_password(request.password, user.hashed_password):
        raise InvalidCredentialsException()

    # 토큰 생성
    data = {"sub": user.username}
    access_token = create_access_token(data, TokenType.ACCESS_TOKEN)
    refresh_token = create_access_token(data, TokenType.REFRESH_TOKEN)
    
    return LoginResponse(
        access_token=access_token, 
        refresh_token=refresh_token,
        user=User.from_orm(user)
    )


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
    responses=AppException.to_openapi_examples([
        InvalidAuthHeaderException,
        UserNotFoundException,
        AuthTokenExpiredException,
        InvalidTokenException,
        InvalidTokenTypeException,
        InvalidCredentialsException,
        InvalidPasswordFormatException,
    ]),
)
def change_password(
    request: ChangePasswordRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    if not authorization.startswith("Bearer "):
        raise InvalidAuthHeaderException()

    access_token = authorization[7:]
    token_data = verify_token(access_token, TokenType.ACCESS_TOKEN)
    username = token_data["username"]

    user = get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()

    if not verify_password(request.current_password, user.hashed_password):
        raise InvalidCredentialsException()

    hashed_pw = hash_password(request.new_password)
    update_user_password(db, user, hashed_pw)

    return ChangePasswordResponse(message="Password updated successfully")


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

    raise AccountDeletionFailedException()
