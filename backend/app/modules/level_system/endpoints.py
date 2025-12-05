from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.config import get_db
from ...core.exceptions import UserNotFoundException
from ..users import crud as user_crud
from . import schemas
from ...core.logger import logger
from ...core.auth import oauth2_scheme, verify_token, TokenType
from ...core.level.context import LevelContext
from .strategy_impl import HeuristicLevelSystemStrategy


router = APIRouter(prefix="/level-system", tags=["level-system"])
context = LevelContext(HeuristicLevelSystemStrategy())

def get_current_user(token=Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token.credentials, TokenType.ACCESS_TOKEN)
    username = payload["username"]
    user = user_crud.get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()
    return user


@router.post("/session-feedback", response_model=schemas.SessionFeedbackResponse)
def submit_session_feedback(
    feedback: schemas.SessionFeedbackRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info(
        "Session feedback - user: %d, gen_content_id: %d, data: %s",
        current_user.id,
        feedback.generated_content_id,
        feedback.model_dump(exclude_none=True)
    )

    result = context.evaluate_session_feedback(
        db=db,
        user=current_user,
        payload=feedback
    )

    logger.info(
        "Level update result - user: %d, result: %s",
        current_user.id,
        result,
    )
    return result


@router.post("/level-test", response_model=schemas.LevelTestResponse)
def evaluate_level_test(
        payload: schemas.LevelTestRequest,
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
):
        """초기 레벨 테스트 결과를 처리하는 엔드포인트.

        요청 예시:
        {
            "tests": [
                {"script_id": "string", "generated_content_id": 0, "understanding": 0}
            ]
        }
        """
        return context.evaluate_level_test(
                db=db,
                user=current_user,
                payload=payload,
        )


@router.post("/manual-level", response_model=schemas.ManualLevelResponse)
def set_manual_level(
    payload: schemas.ManualLevelRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """수동으로 CEFR 레벨을 설정하는 엔드포인트.
    """
    return context.set_manual_level(db=db, user=current_user, payload=payload)




