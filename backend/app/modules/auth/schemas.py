from pydantic import BaseModel

class SignupRequest(BaseModel):
    username: str
    password: str

class SignupResponse(BaseModel):
    access_token: str
    refresh_token: str