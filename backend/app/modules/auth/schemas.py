from pydantic import BaseModel, constr

class SignupRequest(BaseModel):
    username: constr(min_length=3, max_length=30, regex=r'^[a-zA-Z0-9_]+$')
    password: constr(min_length=8, max_length=128)

class SignupResponse(BaseModel):
    access_token: str
    refresh_token: str