from dataclasses import dataclass
import json
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from sqlalchemy.orm import Session

from app.core.llm import LLMServiceError, OpenAILLMClient, PromptStore

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
    level_score: int
    llm_confidence: int
    average_understanding: int
    sample_count: int
    rationale: str
    
# 프롬프트 캐싱
_PROMPT_STORE = PromptStore(Path(__file__).resolve().parent / "prompts")
_CEFR_SCORING_BANDS: Sequence[Tuple[CEFRLevel, Tuple[int, int]]] = (
    (CEFRLevel.A1, (0, 20)),
    (CEFRLevel.A2, (21, 35)),
    (CEFRLevel.B1, (36, 55)),
    (CEFRLevel.B2, (56, 75)),
    (CEFRLevel.C1, (76, 90)),
    (CEFRLevel.C2, (91, 100)),
)
_CEFR_SCORING_LOOKUP: Dict[CEFRLevel, Tuple[int, int]] = {
    level: bounds for level, bounds in _CEFR_SCORING_BANDS
}


class PersonalizationService:
    def __init__(self, *, llm_client: Optional[OpenAILLMClient] = None):
        self._llm_client = llm_client
        
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
                level_score=evaluation.level_score,
                llm_confidence=evaluation.llm_confidence,
            ),
            rationale=evaluation.rationale,
            updated_at=user_record.level_updated_at,
        )

    def _summarize_level_test(
        self,
        *,
        tests: List[schemas.LevelTestItem],
        scripts: Dict[str, LevelTestScript],
    ) -> LevelEvaluationResult:
        average_understanding = round(
            sum(item.understanding for item in tests) / len(tests)
        )
        sample_count = len(tests)
        fallback_level = self._infer_level_from_score(average_understanding)

        test_payload = [
            {
                "script_id": item.script_id,
                "target_level": scripts[item.script_id].target_level.value,
                "transcript": scripts[item.script_id].transcript,
                "self_reported_understanding": item.understanding,
            }
            for item in tests
        ]
        cefr_payload = [
            {
                "level": level.value,
                "min_score": bounds[0],
                "max_score": bounds[1],
                "descriptor": schemas.CEFR_LEVEL_DESCRIPTIONS[level],
            }
            for level, bounds in _CEFR_SCORING_BANDS
        ]

        prompt = _PROMPT_STORE.load("level_evaluation")
        user_prompt = prompt.user.format(
            cefr_bands=json.dumps(cefr_payload, ensure_ascii=False, indent=2),
            tests=json.dumps(test_payload, ensure_ascii=False, indent=2),
        )

        try:
            raw = self._resolve_llm_client().generate_json(
                model="gpt-5-nano",
                system_prompt=prompt.system,
                user_prompt=user_prompt,
                temperature=0.2,
            )
            llm_payload = json.loads(raw)
        except (LLMServiceError, json.JSONDecodeError):
            return LevelEvaluationResult(
                level=fallback_level,
                level_score=self._default_band_midpoint(fallback_level),
                llm_confidence=average_understanding,
                rationale="LLM 평가가 실패하여 자기 보고 이해도 기반의 휴리스틱 결과를 사용했습니다.",
            )

        assigned_level = self._extract_level(llm_payload, fallback_level)
        level_score = self._clamp_score(
            llm_payload.get("level_score"),
            self._default_band_midpoint(assigned_level),
        )
        llm_confidence = self._clamp_score(
            llm_payload.get("llm_confidence"),
            level_score,
        )
        rationale = self._extract_rationale(llm_payload)

        return LevelEvaluationResult(
            level=assigned_level,
            level_score=level_score,
            llm_confidence=llm_confidence,
            average_understanding=average_understanding,
            sample_count=sample_count,
            rationale=rationale,
        )

    def _resolve_llm_client(self) -> OpenAILLMClient:
        if self._llm_client is None:
            self._llm_client = OpenAILLMClient()
        return self._llm_client

    @staticmethod
    def _clamp_score(value: object, default: int) -> int:
        try:
            numeric = int(value)
        except (TypeError, ValueError):
            numeric = default
        return max(0, min(100, numeric))

    def _infer_level_from_score(self, score: int) -> CEFRLevel:
        for level, (_, upper) in _CEFR_SCORING_BANDS:
            if score <= upper:
                return level
        return CEFRLevel.C2

    def _default_band_midpoint(self, level: CEFRLevel) -> int:
        lower, upper = _CEFR_SCORING_LOOKUP[level]
        return (lower + upper) // 2

    def _extract_level(
        self,
        payload: Dict[str, object],
        fallback: CEFRLevel,
    ) -> CEFRLevel:
        candidate = payload.get("level")
        if isinstance(candidate, str):
            try:
                return CEFRLevel(candidate)
            except ValueError:
                return fallback
        return fallback

    @staticmethod
    def _extract_rationale(payload: Dict[str, object]) -> str:
        rationale = payload.get("rationale")
        if isinstance(rationale, str) and rationale.strip():
            return rationale.strip()
        return "평가 근거가 제공되지 않았습니다."
