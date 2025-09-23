from fastapi import HTTPException
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    status_code: int
    custom_code: str
    detail: str


class AppException(HTTPException):
    status_code: int
    custom_code: str
    detail: str

    def __init__(self, status_code: int, custom_code: str, detail: str):
        super().__init__(status_code=status_code, detail=detail)
        self.custom_code = custom_code

    @classmethod
    def openapi_example(cls):
        """swagger error response example"""
        return {
            cls().status_code: {
                "model": ErrorResponse,
                "description": cls().detail,
                "content": {
                    "application/json": {
                        "example": {
                            "status_code": cls().status_code,
                            "custom_code": cls().custom_code,
                            "detail": cls().detail,
                        }
                    }
                },
            }
        }


class UserNotFoundException(AppException):
    def __init__(self):
        super().__init__(404, "USER_NOT_FOUND", "The requested user does not exist.")


class InvalidCredentialsException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_CREDENTIALS", "Invalid username or password")


class UsernameExistsException(AppException):
    def __init__(self):
        super().__init__(400, "USERNAME_EXISTS", "Username already exists.")


class AuthTokenExpiredException(AppException):
    def __init__(self):
        super().__init__(401, "AUTH_TOKEN_EXPIRED", "Authentication token has expired.")
