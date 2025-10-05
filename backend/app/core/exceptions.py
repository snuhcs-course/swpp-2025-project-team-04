from pydantic import BaseModel
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

class ErrorResponse(BaseModel):
    status_code: int
    custom_code: str
    detail: str



class AppException(HTTPException):
    custom_code: str

    def __init__(self, status_code: int, custom_code: str, detail: str):
        super().__init__(status_code=status_code, detail=detail)
        self.custom_code = custom_code

    @staticmethod
    def to_openapi_examples(cls_list):
        """
        cls_list: 예외 클래스 리스트
        동일 status_code 예외는 examples로 묶음
        Description은 비워두거나 고정 메시지
        Example Value는 code/detail 그대로
        """
        responses = {}
        for cls_ in cls_list:
            inst = cls_()
            sc = inst.status_code

            if sc not in responses:
                responses[sc] = {
                    "model": ErrorResponse,
                    "description": "",  
                    "content": {"application/json": {"examples": {}}}
                }

            # Example Value
            responses[sc]["content"]["application/json"]["examples"][inst.custom_code] = {
                "summary": inst.custom_code,
                "value": {
                    "status_code": inst.status_code,
                    "custom_code": inst.custom_code,
                    "detail": inst.detail
                }
            }
        return responses





def register_exception_handlers(app):
    # 기존 AppException 처리
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

    # Pydantic ValidationError 
    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
        for error in exc.raw_errors:
            if isinstance(error.exc, AppException):
                app_exc = error.exc
                return JSONResponse(
                    status_code=app_exc.status_code,
                    content={
                        "status_code": app_exc.status_code,
                        "custom_code": app_exc.custom_code,
                        "detail": app_exc.detail
                    }
                )
        first_error = exc.errors()[0]
        return JSONResponse(
            status_code=422,
            content={
                "status_code": 422,
                "custom_code": "VALIDATION_ERROR",
                "detail": first_error.get("msg", "Invalid input")
            }
        )

# user

class UserNotFoundException(AppException):
    def __init__(self):
        super().__init__(404, "USER_NOT_FOUND", "The requested user does not exist.")

class InvalidCredentialsException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_CREDENTIALS", "Invalid username or password")

class InvalidUsernameFormatException(AppException):
    def __init__(self):
        super().__init__(422, "INVALID_USERNAME_FORMAT", "Username must be 6~16 characters long and contain only letters and numbers")


class InvalidPasswordFormatException(AppException):
    def __init__(self):
        super().__init__(422, "INVALID_PASSWORD_FORMAT", "Password must be 8~32 characters long and include at least one letter and one number")


class UsernameExistsException(AppException):
    def __init__(self):
        super().__init__(400, "USERNAME_EXISTS", "Username already exists.")

class AccountDeletionFailedException(AppException):
    def __init__(self):
        super().__init__(500, "ACCOUNT_DELETION_FAILED", "Failed to delete account")


# token

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


