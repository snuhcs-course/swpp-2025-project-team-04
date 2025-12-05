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
from .service import (
    LevelManagementService,
    LevelTestScriptNotFoundException,
    GeneratedContentNotFoundException,
)
from ...core.level.context import LevelContext            
from .strategy_impl import AILevelManagementStrategy  


router = APIRouter(prefix="/level-management", tags=["level-management"])

context = LevelContext(AILevelManagementStrategy())  


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


@router.post(
    "/level-test",
    response_model=schemas.LevelTestResponse,
    responses=AppException.to_openapi_examples(
        [
            InvalidAuthHeaderException,
            UserNotFoundException,
            AuthTokenExpiredException,
            InvalidTokenException,
            InvalidTokenTypeException,
            LevelTestScriptNotFoundException,
        ]
    ),
)
def evaluate_level(
    payload: schemas.LevelTestRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return context.evaluate_initial_level(db=db, user=current_user, payload=payload)


@router.post(
    "/session-feedback",
    response_model=schemas.LevelTestResponse,
    responses=AppException.to_openapi_examples(
        [
            InvalidAuthHeaderException,
            UserNotFoundException,
            AuthTokenExpiredException,
            InvalidTokenException,
            InvalidTokenTypeException,
            LevelTestScriptNotFoundException,
            GeneratedContentNotFoundException,
        ]
    ),
)
def evaluate_session_feedback(
    payload: schemas.LevelTestRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return context.evaluate_session_feedback(db=db, user=current_user, payload=payload)


@router.post(
    "/manual-level",
    response_model=schemas.ManualLevelUpdateResponse,
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
def set_manual_level(
    payload: schemas.ManualLevelUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return context.set_manual_level(db=db, user=current_user, payload=payload)
