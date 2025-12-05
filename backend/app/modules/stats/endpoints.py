from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from ...core.auth import TokenType, verify_token
from ...core.config import get_db
from ...core.exceptions import (
    AppException,
    AuthTokenExpiredException,
    InvalidAuthHeaderException,
    InvalidTokenException,
    InvalidTokenTypeException,
    UserNotFoundException,
)
from ..users import crud as user_crud
from . import schemas
from .service import StatsService

router = APIRouter(prefix="/stats", tags=["stats"])
service = StatsService()


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise InvalidAuthHeaderException()

    token = authorization[7:]
    payload = verify_token(token, TokenType.ACCESS_TOKEN)
    username = payload["username"]

    user = user_crud.get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()
    return user


@router.get(
    "",
    response_model=schemas.UserStatsResponse,
    responses=AppException.to_openapi_examples(
        [
            InvalidAuthHeaderException,
            UserNotFoundException,
            AuthTokenExpiredException,
            InvalidTokenException,
            InvalidTokenTypeException,
        ]
    ),
)
def get_stats(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_user_stats(db=db, user=current_user)
