from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException
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

# JWT Blocklist for logout functionality
_jwt_blocklist = set() 

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def add_token_to_blocklist(token: str):
    """Add a token to the blocklist"""
    _jwt_blocklist.add(token)

def is_token_blocklisted(token: str) -> bool:
    """Check if a token is in the blocklist"""
    return token in _jwt_blocklist

def verify_token(token: str) -> dict:
    try:
        # Check if token is blocklisted
        if is_token_blocklisted(token):
            raise HTTPException(status_code=401, detail="Token has been revoked")
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token: no subject")
        return {"username": username, "payload": payload}
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")