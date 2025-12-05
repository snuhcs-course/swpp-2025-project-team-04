from pydantic import BaseModel, Field, field_validator
import re
from ...core.exceptions import InvalidPasswordFormatException, InvalidUsernameFormatException
from ..users.schemas import User


class UserCredentials(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not (3 <= len(v) <= 30):
            raise InvalidUsernameFormatException()
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not (3 <= len(v) <= 30):
            raise InvalidPasswordFormatException()
        return v



class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str


class SignupRequest(UserCredentials):
    nickname: str = Field(default="")

class SignupResponse(TokensResponse):
    user: User

class LoginRequest(UserCredentials):
    pass

class LoginResponse(TokensResponse):
    user: User

class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    refresh_token: str
class AccessTokenResponse(BaseModel):
    access_token: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("current_password", "new_password")
    @classmethod
    def validate_password(cls, v):
        if not (3 <= len(v) <= 30):
            raise InvalidPasswordFormatException()
        return v

class ChangePasswordResponse(BaseModel):
    message: str

class DeleteAccountResponse(BaseModel):
    message: str
