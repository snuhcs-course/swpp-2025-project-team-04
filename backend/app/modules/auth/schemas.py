from pydantic import BaseModel, constr


class UserCredentials(BaseModel):
    username: constr(min_length=3, max_length=30, pattern=r'^[a-zA-Z0-9_]+$')
    password: constr(min_length=8, max_length=128)

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

class LogoutRequest(BaseModel):
    access_token: str
    refresh_token: str

class LogoutResponse(BaseModel):

class DeleteAccountResponse(BaseModel):
    message: str