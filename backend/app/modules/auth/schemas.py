from pydantic import BaseModel, Field, field_validator
import re
from ...core.exceptions import InvalidUsernameFormatException, InvalidPasswordFormatException


class UserCredentials(BaseModel):
    username: str  # min_length, max_length 제거
    password: str  # min_length, max_length 제거

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not (6 <= len(v) <= 16):
            raise InvalidUsernameFormatException()
        if not re.match(r"^[a-zA-Z0-9]+$", v):
            raise InvalidUsernameFormatException()
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not (8 <= len(v) <= 32):
            raise InvalidPasswordFormatException()
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"[0-9]", v):
            raise InvalidPasswordFormatException()
        return v

class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str


class SignupRequest(UserCredentials):
    pass # TODO : 회원가입 request body fields는 추후 수정 예정

class SignupResponse(TokensResponse):
    pass

class LoginRequest(UserCredentials):
    pass

class LoginResponse(TokensResponse):
    pass

class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    refresh_token: str
class AccessTokenResponse(BaseModel):
    access_token: str

class DeleteAccountResponse(BaseModel):
    message: str