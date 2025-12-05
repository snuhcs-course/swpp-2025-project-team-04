from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from types import SimpleNamespace
from typing import Dict, List, Mapping, Optional, Sequence, Tuple

from sqlalchemy.orm import Session

from ...core.llm import LLMServiceError, OpenAILLMClient, PromptStore

from ...core.exceptions import AppException
from ..users import crud as user_crud
from ..users.models import User
from . import crud, schemas
from .models import CEFRLevel


class LevelTestScriptNotFoundException(AppException):
    def __init__(self, script_id: str = "unknown"):
        super().__init__(
            status_code=400,
            custom_code="LEVEL_TEST_SCRIPT_NOT_FOUND",
            detail=f"요청한 스크립트({script_id})를 찾을 수 없습니다.",
        )


class GeneratedContentNotFoundException(AppException):
    def __init__(self, content_id: int | str = "unknown"):
        super().__init__(
            status_code=400,
            custom_code="GENERATED_CONTENT_NOT_FOUND",
            detail=f"요청한 생성 콘텐츠({content_id})를 찾을 수 없습니다.",
        )


@dataclass
class LevelEvaluationResult:
    level: CEFRLevel
    level_score: int
    llm_confidence: int
    average_understanding: int
    sample_count: int
    rationale: str
    llm_success: bool
    
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

class LevelManagementService:
    def __init__(self, *, llm_client: Optional[OpenAILLMClient] = None):
        self._llm_client = llm_client

    def _build_user_profile(self, user: User, *, context: str) -> Dict[str, object]:
        level = getattr(user, "level", None)
        if hasattr(level, "value"):
            level_value = level.value  # type: ignore[attr-defined]
        elif isinstance(level, str):
            level_value = level
        elif level is None:
            level_value = None
        else:
            level_value = str(level)

        profile = {
            "context": context,
            "current_level": level_value,
            "level_score": getattr(user, "level_score", None),
            "llm_confidence": getattr(user, "llm_confidence", None),
            "initial_level_completed": getattr(user, "initial_level_completed", False),
            "level_updated_at": user.level_updated_at.isoformat() if getattr(user, "level_updated_at", None) else None,
        }
        return profile
        
    def evaluate_initial_level(
        self,
        *,
        db: Session,
        user: User,
        payload: schemas.LevelTestRequest,
    ) -> schemas.LevelTestResponse:
        script_ids: List[str] = []
        for item in payload.tests:
            if item.script_id is None:
                raise LevelTestScriptNotFoundException()
            script_ids.append(item.script_id)

        scripts = crud.get_scripts_by_ids(db, script_ids)

        for script_id in script_ids:
            if scripts.get(script_id) is None:
                raise LevelTestScriptNotFoundException(script_id)

        evaluation = self._summarize_level_test(
            tests=payload.tests,
            scripts=scripts,
            current_profile=self._build_user_profile(user, context="initial_level_assessment"),
        )

        if not evaluation.llm_success:
            db.refresh(user)
            current_level = self._coerce_user_level(user, fallback=evaluation.level)
            level_score = self._clamp_score(getattr(user, "level_score", None), evaluation.level_score)
            llm_confidence = self._clamp_score(getattr(user, "llm_confidence", None), evaluation.llm_confidence)
            updated_at = getattr(user, "level_updated_at", None) or datetime.now(timezone.utc)

            return schemas.LevelTestResponse(
                level=current_level,
                level_description=schemas.CEFR_LEVEL_DESCRIPTIONS[current_level],
                scores=schemas.LevelScores(
                    level_score=level_score,
                    llm_confidence=llm_confidence,
                ),
                rationale=evaluation.rationale,
                updated_at=updated_at,
            )

        user_record = user_crud.update_user_level(
            db,
            user_id=user.id,
            level=evaluation.level,
            level_score=evaluation.level_score,
            llm_confidence=evaluation.llm_confidence,
            initial_level_completed=True,
            commit=False,
        )
        history_record = crud.insert_level_history(
            db,
            user_id=user.id,
            level=evaluation.level,
            level_score=evaluation.level_score,
            llm_confidence=evaluation.llm_confidence,
            average_understanding=evaluation.average_understanding,
            sample_count=evaluation.sample_count,
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

    def evaluate_session_feedback(
        self,
        *,
        db: Session,
        user: User,
        payload: schemas.LevelTestRequest,
    ) -> schemas.LevelTestResponse:
        content_ids: List[int] = []
        for item in payload.tests:
            if item.generated_content_id is None:
                raise GeneratedContentNotFoundException()
            content_ids.append(item.generated_content_id)

        contents = crud.get_generated_contents_by_ids(db, content_ids)

        script_lookup: Dict[str, SimpleNamespace] = {}
        default_target_level = self._coerce_user_level(user)

        for content_id in content_ids:
            record = contents.get(content_id)
            if record is None:
                raise GeneratedContentNotFoundException(content_id)
            if record.script_data is None:
                raise GeneratedContentNotFoundException(content_id)

            script_lookup[str(content_id)] = SimpleNamespace(
                transcript=record.script_data,
                target_level=default_target_level,
                title=record.title,
            )


        evaluation = self._summarize_level_test(
            tests=payload.tests,
            scripts=script_lookup,
            current_profile=self._build_user_profile(user, context="session_feedback"),
            default_target_level=default_target_level,
        )

        if not evaluation.llm_success:
            db.refresh(user)
            current_level = self._coerce_user_level(user, fallback=evaluation.level)
            level_score = self._clamp_score(getattr(user, "level_score", None), evaluation.level_score)
            llm_confidence = self._clamp_score(getattr(user, "llm_confidence", None), evaluation.llm_confidence)
            updated_at = getattr(user, "level_updated_at", None) or datetime.now(timezone.utc)

            return schemas.LevelTestResponse(
                level=current_level,
                level_description=schemas.CEFR_LEVEL_DESCRIPTIONS[current_level],
                scores=schemas.LevelScores(
                    level_score=level_score,
                    llm_confidence=llm_confidence,
                ),
                rationale=evaluation.rationale,
                updated_at=updated_at,
            )

        user_record = user_crud.update_user_level(
            db,
            user_id=user.id,
            level=evaluation.level,
            level_score=evaluation.level_score,
            llm_confidence=evaluation.llm_confidence,
            initial_level_completed=True,
            commit=False,
        )
        history_record = crud.insert_level_history(
            db,
            user_id=user.id,
            level=evaluation.level,
            level_score=evaluation.level_score,
            llm_confidence=evaluation.llm_confidence,
            average_understanding=evaluation.average_understanding,
            sample_count=evaluation.sample_count,
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

    def set_manual_level(
        self,
        *,
        db: Session,
        user: User,
        payload: schemas.ManualLevelUpdateRequest,
    ) -> schemas.ManualLevelUpdateResponse:
        user_record = user_crud.update_user_level(
            db,
            user_id=user.id,
            level=payload.level,
            initial_level_completed=True,
            commit=False,
        )
        history_record = crud.insert_level_history(
            db,
            user_id=user.id,
            level=payload.level,
        )

        db.commit()
        db.refresh(user_record)
        db.refresh(history_record)

        return schemas.ManualLevelUpdateResponse(
            level=payload.level,
            level_description=schemas.CEFR_LEVEL_DESCRIPTIONS[payload.level],
            updated_at=user_record.level_updated_at,
        )


    def _summarize_level_test(
        self,
        *,
        tests: List[schemas.LevelTestItem],
        scripts: Mapping[str, object],
        current_profile: Optional[Dict[str, object]] = None,
        default_target_level: Optional[CEFRLevel] = None,
    ) -> LevelEvaluationResult:
        average_understanding = round(
            sum(item.understanding for item in tests) / len(tests)
        )
        sample_count = len(tests)
        fallback_level = self._infer_level_from_score(average_understanding)
        default_target_level = default_target_level or fallback_level

        test_payload = []
        for item in tests:
            identifier = self._resolve_test_identifier(item)
            script_entry = scripts.get(identifier)

            if script_entry is None:
                if item.script_id is not None:
                    raise LevelTestScriptNotFoundException(item.script_id)
                raise GeneratedContentNotFoundException(item.generated_content_id or "unknown")

            target_level = self._coerce_target_level(script_entry, default_target_level)
            transcript = self._extract_transcript(script_entry)

            payload_entry = {
                "identifier": identifier,
                "target_level": target_level.value,
                "transcript": transcript,
                "self_reported_understanding": item.understanding,
            }
            if item.script_id is not None:
                payload_entry["script_id"] = item.script_id
            if item.generated_content_id is not None:
                payload_entry["generated_content_id"] = item.generated_content_id
            title = getattr(script_entry, "title", None)
            if isinstance(title, str) and title.strip():
                payload_entry["title"] = title.strip()

            test_payload.append(payload_entry)

        cefr_payload = [
            {
                "level": level.value,
                "min_score": bounds[0],
                "max_score": bounds[1],
                "descriptor": schemas.CEFR_LEVEL_DESCRIPTIONS[level],
            }
            for level, bounds in _CEFR_SCORING_BANDS
        ]

        profile_payload = current_profile or {
            "context": "unknown",
            "note": "No prior learner profile was provided.",
        }
        prompt = _PROMPT_STORE.load("level_evaluation")
        user_prompt = prompt.user.format(
            cefr_bands=json.dumps(cefr_payload, ensure_ascii=False, indent=2),
            current_profile=json.dumps(profile_payload, ensure_ascii=False, indent=2),
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
                average_understanding=average_understanding,
                sample_count=sample_count,
                rationale="LLM 평가가 실패하여 자기 보고 이해도 기반의 휴리스틱 결과를 사용했습니다.",
                llm_success=False,
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
            llm_success=True,
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

    @staticmethod
    def _resolve_test_identifier(item: schemas.LevelTestItem) -> str:
        if item.script_id is not None:
            return item.script_id
        if item.generated_content_id is not None:
            return str(item.generated_content_id)
        raise ValueError("레벨 평가 항목에 식별자가 없습니다.")

    def _coerce_user_level(self, user: User, fallback: Optional[CEFRLevel] = None) -> CEFRLevel:
        effective_fallback = fallback or CEFRLevel.B1
        source_level = getattr(user, "level", None)
        return self._coerce_level_value(source_level, effective_fallback)

    def _coerce_target_level(self, source: object, fallback: CEFRLevel) -> CEFRLevel:
        candidate = getattr(source, "target_level", None)
        return self._coerce_level_value(candidate, fallback)

    def _coerce_level_value(self, candidate: object, fallback: CEFRLevel) -> CEFRLevel:
        if isinstance(candidate, CEFRLevel):
            return candidate
        value = getattr(candidate, "value", None)
        if isinstance(value, str):
            try:
                return CEFRLevel(value)
            except ValueError:
                pass
        if isinstance(candidate, str):
            try:
                return CEFRLevel(candidate)
            except ValueError:
                pass
        return fallback

    @staticmethod
    def _extract_transcript(source: object) -> str:
        transcript = getattr(source, "transcript", None)
        if isinstance(transcript, str) and transcript.strip():
            return transcript
        script_data = getattr(source, "script_data", None)
        if isinstance(script_data, str):
            return script_data
        return ""
