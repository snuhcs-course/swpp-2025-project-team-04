from dataclasses import dataclass
from typing import Dict, List

from sqlalchemy.orm import Session

from ...core.exceptions import AppException
from ..users import crud as user_crud
from ..users.models import User
from . import crud, schemas
from .models import CEFRLevel, LevelTestScript


class LevelTestScriptNotFoundException(AppException):
    def __init__(self, script_id: str):
        super().__init__(
            status_code=400,
            custom_code="LEVEL_TEST_SCRIPT_NOT_FOUND",
            detail=f"요청한 스크립트({script_id})를 찾을 수 없습니다.",
        )


@dataclass
class LevelEvaluationResult:
    level: CEFRLevel
    average_understanding: float
    sample_count: int


class PersonalizationService:
    def evaluate_initial_level(
        self,
        *,
        db: Session,
        user: User,
        payload: schemas.LevelTestRequest,
    ) -> schemas.LevelTestResponse:
        script_ids = [item.script_id for item in payload.tests]
        scripts = crud.get_scripts_by_ids(db, script_ids)

        for item in payload.tests:
            if scripts.get(item.script_id) is None:
                raise LevelTestScriptNotFoundException(item.script_id)

        evaluation = self._summarize_level_test(
            tests=payload.tests,
            scripts=scripts,
        )

        user_record = user_crud.update_user_level(
            db,
            user_id=user.id,
            level=evaluation.level,
            commit=False,
        )
        history_record = crud.insert_level_history(
            db,
            user_id=user.id,
            level=evaluation.level,
        )

        db.commit()
        db.refresh(user_record)
        db.refresh(history_record)

        return schemas.LevelTestResponse(
            level=evaluation.level,
            level_description=schemas.CEFR_LEVEL_DESCRIPTIONS[evaluation.level],
            scores=schemas.LevelScores(
                average_understanding=evaluation.average_understanding,
                sample_count=evaluation.sample_count,
            ),
            updated_at=user_record.level_updated_at,
        )

    def _summarize_level_test(
        self,
        *,
        tests: List[schemas.LevelTestItem],
        scripts: Dict[str, LevelTestScript],
    ) -> LevelEvaluationResult:
        """
        TODO: 레벨 테스트 로직
        """
