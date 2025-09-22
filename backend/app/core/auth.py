from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import HTTPException
from enum import Enum
from .config import settings

# 패스워드 해싱용 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT 토큰 생성용 설정
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

class TokenType(Enum):
    ACCESS_TOKEN = "access"
    REFRESH_TOKEN = "refresh"

def create_access_token(data: dict, token_type: TokenType = TokenType.ACCESS_TOKEN) -> str:
    to_encode = data.copy()
    
    if token_type == TokenType.REFRESH_TOKEN:
        expire = datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRE_DAYS)
    else :
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    
    to_encode.update({"exp": expire, "type": token_type.value})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, expected_type: TokenType) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type_str: str = payload.get("type")
        
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token: no subject")
        
        if token_type_str != expected_type.value:
            raise HTTPException(status_code=401, detail=f"Invalid token type: expected {expected_type.value}, got {token_type_str}")
            
        return {"username": username, "token_type": token_type_str, "payload": payload}
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")