from pydantic import BaseModel
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

class ErrorResponse(BaseModel):
    status_code: int
    custom_code: str
    detail: str



class AppException(HTTPException):
    custom_code: str

    def __init__(self, status_code: int, custom_code: str, detail: str):
        super().__init__(status_code=status_code, detail=detail)
        self.custom_code = custom_code

    @classmethod
    def openapi_example(cls):
        """swagger error response examples에 등록"""
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

def register_exception_handlers(app):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status_code": exc.status_code,
                "custom_code": exc.custom_code,
                "detail": exc.detail,
            },
        )



class UserNotFoundException(AppException):
    def __init__(self):
        super().__init__(404, "USER_NOT_FOUND", "The requested user does not exist.")

class InvalidCredentialsException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_CREDENTIALS", "Invalid username or password")


class UsernameExistsException(AppException):
    def __init__(self):
        super().__init__(400, "USERNAME_EXISTS", "Username already exists.")

class AccountDeletionFailedException(AppException):
    def __init__(self):
        super().__init__(500, "ACCOUNT_DELETION_FAILED", "Failed to delete account")





class AuthTokenExpiredException(AppException):
    def __init__(self):
        super().__init__(401, "AUTH_TOKEN_EXPIRED", "Authentication token has expired.")


class InvalidTokenException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_TOKEN", "Token is invalid")


class InvalidTokenTypeException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_TOKEN_TYPE", "Invalid token type")


class InvalidAuthHeaderException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_AUTH_HEADER", "Invalid authorization header")

