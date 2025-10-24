import json
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Dict

import pytest

from app.core.llm import LLMServiceError
from app.modules.personalization import crud, schemas
from app.modules.personalization.models import CEFRLevel, LevelTestScript
from app.modules.personalization.service import PersonalizationService
from app.modules.users import crud as user_crud


class FakePrompt:
    system = "system prompt"
    user = "tests: {tests}\ncefr: {cefr_bands}"


@pytest.fixture(autouse=True)
def patch_prompt_store(monkeypatch):
    from app.modules.personalization import service as service_module
    monkeypatch.setattr(service_module._PROMPT_STORE, "load", lambda _: FakePrompt)


class FakeLLMClient:
    def __init__(self, *, response: str | None = None, error: Exception | None = None):
        self._response = response
        self._error = error
        self.calls = []

    def generate_json(self, **kwargs) -> str:
        self.calls.append(kwargs)
        if self._error is not None:
            raise self._error
        return self._response


def make_scripts() -> Dict[str, LevelTestScript]:
    return {
        "script-a": LevelTestScript(
            id="script-a",
            transcript="Welcome to the placement test.",
            target_level=CEFRLevel.B1,
        ),
        "script-b": LevelTestScript(
            id="script-b",
            transcript="Advanced discussion about economics.",
            target_level=CEFRLevel.C1,
        ),
    }


def test_summarize_level_test_with_llm_success():
    llm = FakeLLMClient(
        response=json.dumps(
            {
                "level": "B2",
                "level_score": 68,
                "llm_confidence": 72,
                "rationale": "Learner shows solid upper-intermediate comprehension.",
            }
        )
    )
    service = PersonalizationService(llm_client=llm)

    tests = [
        schemas.LevelTestItem(script_id="script-a", understanding=55),
        schemas.LevelTestItem(script_id="script-b", understanding=60),
    ]
    result = service._summarize_level_test(
        tests=tests,
        scripts=make_scripts(),
    )

    assert result.level == CEFRLevel.B2
    assert result.level_score == 68
    assert result.llm_confidence == 72
    assert "upper-intermediate" in result.rationale
    assert len(llm.calls) == 1


def test_summarize_level_test_llm_failure_falls_back():
    llm = FakeLLMClient(error=LLMServiceError("network down"))
    service = PersonalizationService(llm_client=llm)

    tests = [
        schemas.LevelTestItem(script_id="script-a", understanding=42),
        schemas.LevelTestItem(script_id="script-b", understanding=38),
    ]
    result = service._summarize_level_test(
        tests=tests,
        scripts=make_scripts(),
    )

    assert result.level == CEFRLevel.B1  # 평균 40 → B1 구간
    assert result.level_score == 45      # B1 구간 중간값
    assert result.llm_confidence == 40
    assert "휴리스틱" in result.rationale


def test_summarize_level_test_invalid_llm_payload_uses_defaults():
    llm = FakeLLMClient(
        response=json.dumps(
            {
                "level": "Z9",           # 잘못된 레벨 → fallback
                "level_score": "oops",   # 숫자 아님 → 기본값
                "llm_confidence": -50,   # 범위 밖 → clamp
                "rationale": "",
            }
        )
    )
    service = PersonalizationService(llm_client=llm)

    tests = [
        schemas.LevelTestItem(script_id="script-a", understanding=30),
        schemas.LevelTestItem(script_id="script-b", understanding=32),
    ]
    result = service._summarize_level_test(
        tests=tests,
        scripts=make_scripts(),
    )

    assert result.level == CEFRLevel.A2
    assert result.level_score == 28  # A2 구간 중간값
    assert result.llm_confidence == 0  # clamp 결과
    assert result.rationale == "평가 근거가 제공되지 않았습니다."


class DummySession:
    def __init__(self):
        self.commits = 0
        self.refreshed = []

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        self.refreshed.append(obj)


def test_set_manual_level_updates_user_and_history(monkeypatch):
    db = DummySession()
    user = SimpleNamespace(id=42)
    updated_at = datetime.now(timezone.utc)

    def fake_update_user_level(db_arg, *, user_id, level, commit):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B2
        assert commit is False
        return SimpleNamespace(
            id=user_id,
            level=level,
            level_updated_at=updated_at,
        )

    def fake_insert_level_history(db_arg, *, user_id, level):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B2
        return SimpleNamespace(user_id=user_id, level=level)

    monkeypatch.setattr(user_crud, "update_user_level", fake_update_user_level)
    monkeypatch.setattr(crud, "insert_level_history", fake_insert_level_history)

    service = PersonalizationService()
    payload = schemas.ManualLevelUpdateRequest(level=CEFRLevel.B2)

    response = service.set_manual_level(db=db, user=user, payload=payload)

    assert db.commits == 1
    assert len(db.refreshed) == 2
    assert response.level == CEFRLevel.B2
    assert response.level_description == schemas.CEFR_LEVEL_DESCRIPTIONS[CEFRLevel.B2]
    assert response.updated_at == updated_at
