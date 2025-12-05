import json
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Dict

import pytest

from backend.app.core.llm import LLMServiceError
from backend.app.modules.level_management import crud, schemas
from backend.app.modules.level_management.models import CEFRLevel, LevelTestScript
from backend.app.modules.level_management.service import (
    LevelManagementService,
    LevelTestScriptNotFoundException,
    GeneratedContentNotFoundException,
)
from backend.app.modules.users import crud as user_crud


class FakePrompt:
    system = "system prompt"
    user = "tests: {tests}\ncefr: {cefr_bands}\nprofile: {current_profile}"


@pytest.fixture(autouse=True)
def patch_prompt_store(monkeypatch):
    from backend.app.modules.level_management import service as service_module
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
    service = LevelManagementService(llm_client=llm)

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
    assert result.llm_success is True


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
    service = LevelManagementService(llm_client=llm)

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
    assert result.llm_success is True


def test_summarize_level_test_llm_failure_returns_fallback():
    llm = FakeLLMClient(error=LLMServiceError("network down"))
    service = LevelManagementService(llm_client=llm)

    tests = [
        schemas.LevelTestItem(script_id="script-a", understanding=70),
        schemas.LevelTestItem(script_id="script-b", understanding=60),
    ]

    result = service._summarize_level_test(
        tests=tests,
        scripts=make_scripts(),
    )

    assert result.level == CEFRLevel.B2  # 평균 65 → B2
    assert result.level_score == 65      # B2 구간 중간값
    assert result.llm_confidence == 65   # 자기 보고 이해도 평균
    assert result.sample_count == 2
    assert result.llm_success is False
    assert "LLM 평가가 실패" in result.rationale
    assert len(llm.calls) == 1


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

    def fake_update_user_level(
        db_arg,
        *,
        user_id,
        level,
        level_score=None,
        llm_confidence=None,
        initial_level_completed=None,
        commit,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B2
        assert level_score is None
        assert llm_confidence is None
        assert initial_level_completed is True
        assert commit is False
        return SimpleNamespace(
            id=user_id,
            level=level,
            level_updated_at=updated_at,
        )

    def fake_insert_level_history(
        db_arg,
        *,
        user_id,
        level,
        level_score=None,
        llm_confidence=None,
        average_understanding=None,
        sample_count=None,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B2
        assert level_score is None
        assert llm_confidence is None
        assert average_understanding is None
        assert sample_count is None
        return SimpleNamespace(user_id=user_id, level=level)

    monkeypatch.setattr(user_crud, "update_user_level", fake_update_user_level)
    monkeypatch.setattr(crud, "insert_level_history", fake_insert_level_history)

    service = LevelManagementService()
    payload = schemas.ManualLevelUpdateRequest(level=CEFRLevel.B2)

    response = service.set_manual_level(db=db, user=user, payload=payload)

    assert db.commits == 1
    assert len(db.refreshed) == 2
    assert response.level == CEFRLevel.B2
    assert response.level_description == schemas.CEFR_LEVEL_DESCRIPTIONS[CEFRLevel.B2]
    assert response.updated_at == updated_at


def test_evaluate_session_feedback_updates_user_and_history(monkeypatch):
    db = DummySession()
    updated_at = datetime.now(timezone.utc)
    user = SimpleNamespace(
        id=7,
        level=CEFRLevel.B1,
        level_score=52,
        llm_confidence=48,
        initial_level_completed=True,
        level_updated_at=updated_at,
    )

    llm = FakeLLMClient(
        response=json.dumps(
            {
                "level": "B2",
                "level_score": 70,
                "llm_confidence": 65,
                "rationale": "Learner shows improved comprehension after session.",
            }
        )
    )
    service = LevelManagementService(llm_client=llm)

    def fake_get_generated_contents_by_ids(db_arg, ids):
        assert db_arg is db
        payload = {
            101: SimpleNamespace(
                generated_content_id=101,
                script_data="Welcome to the placement test.",
                title="Session recap A",
            ),
            202: SimpleNamespace(
                generated_content_id=202,
                script_data="Advanced discussion about economics.",
                title="Session recap B",
            ),
        }
        return {content_id: payload[content_id] for content_id in ids}

    def fake_update_user_level(
        db_arg,
        *,
        user_id,
        level,
        level_score=None,
        llm_confidence=None,
        initial_level_completed=None,
        commit,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B2
        assert level_score == 70
        assert llm_confidence == 65
        assert initial_level_completed is True
        assert commit is False
        return SimpleNamespace(
            id=user_id,
            level=level,
            level_updated_at=updated_at,
        )

    def fake_insert_level_history(
        db_arg,
        *,
        user_id,
        level,
        level_score=None,
        llm_confidence=None,
        average_understanding=None,
        sample_count=None,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B2
        assert level_score == 70
        assert llm_confidence == 65
        assert average_understanding == 55
        assert sample_count == 2
        return SimpleNamespace(user_id=user_id, level=level)

    monkeypatch.setattr(crud, "get_generated_contents_by_ids", fake_get_generated_contents_by_ids)
    monkeypatch.setattr(user_crud, "update_user_level", fake_update_user_level)
    monkeypatch.setattr(crud, "insert_level_history", fake_insert_level_history)

    payload = schemas.LevelTestRequest(
        tests=[
            schemas.LevelTestItem(generated_content_id=101, understanding=50),
            schemas.LevelTestItem(generated_content_id=202, understanding=60),
        ]
    )

    response = service.evaluate_session_feedback(db=db, user=user, payload=payload)

    assert db.commits == 1
    assert len(db.refreshed) == 2
    assert response.level == CEFRLevel.B2
    assert response.scores.level_score == 70
    assert '"context": "session_feedback"' in llm.calls[0]["user_prompt"]


def test_evaluate_session_feedback_llm_failure_preserves_user_level(monkeypatch):
    db = DummySession()
    updated_at = datetime.now(timezone.utc)
    user = SimpleNamespace(
        id=8,
        level=CEFRLevel.B2,
        level_score=88,
        llm_confidence=80,
        initial_level_completed=True,
        level_updated_at=updated_at,
    )

    llm = FakeLLMClient(error=LLMServiceError("llm boom"))
    service = LevelManagementService(llm_client=llm)

    def fake_get_generated_contents_by_ids(db_arg, ids):
        assert db_arg is db
        return {
            content_id: SimpleNamespace(
                generated_content_id=content_id,
                script_data="transcript",
                title=f"content-{content_id}",
            )
            for content_id in ids
        }

    monkeypatch.setattr(crud, "get_generated_contents_by_ids", fake_get_generated_contents_by_ids)
    monkeypatch.setattr(
        user_crud,
        "update_user_level",
        lambda *args, **kwargs: pytest.fail("update_user_level should not be called on LLM failure"),
    )
    monkeypatch.setattr(
        crud,
        "insert_level_history",
        lambda *args, **kwargs: pytest.fail("insert_level_history should not be called on LLM failure"),
    )

    payload = schemas.LevelTestRequest(
        tests=[
            schemas.LevelTestItem(generated_content_id=303, understanding=70),
            schemas.LevelTestItem(generated_content_id=404, understanding=60),
        ]
    )

    response = service.evaluate_session_feedback(db=db, user=user, payload=payload)

    assert db.commits == 0
    assert db.refreshed == [user]
    assert response.level == user.level
    assert response.scores.level_score == user.level_score
    assert response.scores.llm_confidence == user.llm_confidence
    assert "LLM 평가가 실패" in response.rationale
    assert len(llm.calls) == 1


def test_evaluate_initial_level_updates_user_and_history(monkeypatch):
    db = DummySession()
    updated_at = datetime.now(timezone.utc)
    user = SimpleNamespace(
        id=12,
        level=CEFRLevel.A2,
        level_score=40,
        llm_confidence=35,
        initial_level_completed=False,
        level_updated_at=updated_at,
    )

    llm = FakeLLMClient(
        response=json.dumps(
            {
                "level": "B1",
                "level_score": 50,
                "llm_confidence": 55,
                "rationale": "Learner shows enough understanding for B1.",
            }
        )
    )
    service = LevelManagementService(llm_client=llm)

    def fake_get_scripts_by_ids(db_arg, ids):
        scripts = make_scripts()
        return {script_id: scripts[script_id] for script_id in ids}

    def fake_update_user_level(
        db_arg,
        *,
        user_id,
        level,
        level_score=None,
        llm_confidence=None,
        initial_level_completed=None,
        commit,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B1
        assert level_score == 50
        assert llm_confidence == 55
        assert initial_level_completed is True
        assert commit is False
        return SimpleNamespace(
            id=user_id,
            level=level,
            level_updated_at=updated_at,
        )

    def fake_insert_level_history(
        db_arg,
        *,
        user_id,
        level,
        level_score=None,
        llm_confidence=None,
        average_understanding=None,
        sample_count=None,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert level == CEFRLevel.B1
        assert level_score == 50
        assert llm_confidence == 55
        assert average_understanding == 55
        assert sample_count == 2
        return SimpleNamespace(user_id=user_id, level=level)

    monkeypatch.setattr(crud, "get_scripts_by_ids", fake_get_scripts_by_ids)
    monkeypatch.setattr(user_crud, "update_user_level", fake_update_user_level)
    monkeypatch.setattr(crud, "insert_level_history", fake_insert_level_history)

    payload = schemas.LevelTestRequest(
        tests=[
            schemas.LevelTestItem(script_id="script-a", understanding=50),
            schemas.LevelTestItem(script_id="script-b", understanding=60),
        ]
    )

    response = service.evaluate_initial_level(db=db, user=user, payload=payload)

    assert db.commits == 1
    assert len(db.refreshed) == 2
    assert response.level == CEFRLevel.B1
    assert response.scores.level_score == 50
    assert '"context": "initial_level_assessment"' in llm.calls[0]["user_prompt"]


def test_evaluate_initial_level_llm_failure_preserves_user_level(monkeypatch):
    db = DummySession()
    updated_at = datetime.now(timezone.utc)
    user = SimpleNamespace(
        id=13,
        level=CEFRLevel.C1,
        level_score=90,
        llm_confidence=85,
        initial_level_completed=True,
        level_updated_at=updated_at,
    )

    llm = FakeLLMClient(error=LLMServiceError("llm failed"))
    service = LevelManagementService(llm_client=llm)

    def fake_get_scripts_by_ids(db_arg, ids):
        assert db_arg is db
        scripts = make_scripts()
        return {script_id: scripts.get(script_id) for script_id in ids}

    monkeypatch.setattr(crud, "get_scripts_by_ids", fake_get_scripts_by_ids)
    monkeypatch.setattr(
        user_crud,
        "update_user_level",
        lambda *args, **kwargs: pytest.fail("update_user_level should not be called on LLM failure"),
    )
    monkeypatch.setattr(
        crud,
        "insert_level_history",
        lambda *args, **kwargs: pytest.fail("insert_level_history should not be called on LLM failure"),
    )

    payload = schemas.LevelTestRequest(
        tests=[
            schemas.LevelTestItem(script_id="script-a", understanding=65),
            schemas.LevelTestItem(script_id="script-b", understanding=70),
        ]
    )

    response = service.evaluate_initial_level(db=db, user=user, payload=payload)

    assert db.commits == 0
    assert db.refreshed == [user]
    assert response.level == user.level
    assert response.scores.level_score == user.level_score
    assert response.scores.llm_confidence == user.llm_confidence
    assert "LLM 평가가 실패" in response.rationale
    assert len(llm.calls) == 1


def test_evaluate_level_raises_when_script_missing(monkeypatch):
    db = DummySession()
    user = SimpleNamespace(
        id=3,
        level=CEFRLevel.A1,
        level_score=None,
        llm_confidence=None,
        initial_level_completed=False,
        level_updated_at=None,
    )

    service = LevelManagementService(llm_client=FakeLLMClient())

    def fake_get_scripts_by_ids(db_arg, ids):
        return {}

    monkeypatch.setattr(crud, "get_scripts_by_ids", fake_get_scripts_by_ids)

    payload = schemas.LevelTestRequest(
        tests=[
            schemas.LevelTestItem(script_id="missing-script", understanding=40),
        ]
    )

    with pytest.raises(LevelTestScriptNotFoundException):
        service.evaluate_initial_level(db=db, user=user, payload=payload)


def test_session_feedback_raises_when_generated_content_missing(monkeypatch):
    db = DummySession()
    user = SimpleNamespace(
        id=5,
        level=CEFRLevel.B1,
        level_score=52,
        llm_confidence=48,
        initial_level_completed=True,
        level_updated_at=None,
    )

    service = LevelManagementService(llm_client=FakeLLMClient())

    def fake_get_generated_contents_by_ids(db_arg, ids):
        return {}

    monkeypatch.setattr(crud, "get_generated_contents_by_ids", fake_get_generated_contents_by_ids)

    payload = schemas.LevelTestRequest(
        tests=[
            schemas.LevelTestItem(generated_content_id=999, understanding=70),
        ]
    )

    with pytest.raises(GeneratedContentNotFoundException):
        service.evaluate_session_feedback(db=db, user=user, payload=payload)


def test_resolve_llm_client_creates_instance(monkeypatch):
    from backend.app.modules.level_management import service as service_module

    class DummyLLM:
        pass

    monkeypatch.setattr(service_module, "OpenAILLMClient", DummyLLM)

    service = LevelManagementService()
    client = service._resolve_llm_client()

    assert isinstance(client, DummyLLM)
    assert service._resolve_llm_client() is client


def test_get_scripts_by_ids_returns_lookup():
    scripts = [
        LevelTestScript(
            id="script-a",
            transcript="Intro",
            target_level=CEFRLevel.A2,
        ),
        LevelTestScript(
            id="script-b",
            transcript="Advanced",
            target_level=CEFRLevel.C1,
        ),
    ]

    class FakeQuery:
        def __init__(self, rows):
            self._rows = rows

        def filter(self, *args, **kwargs):
            return self

        def all(self):
            return self._rows

    class QuerySession(DummySession):
        def query(self, model):
            assert model is LevelTestScript
            return FakeQuery(scripts)

    db = QuerySession()
    result = crud.get_scripts_by_ids(db, ["script-a", "missing"])

    assert result["script-a"] is scripts[0]
    assert result["missing"] is None


def test_insert_level_history_adds_record():
    added = []

    class AddSession(DummySession):
        def add(self, obj):
            added.append(obj)

    db = AddSession()
    record = crud.insert_level_history(
        db,
        user_id=5,
        level=CEFRLevel.B1,
        level_score=60,
        llm_confidence=58,
        average_understanding=55,
        sample_count=3,
    )

    assert record in added
    assert record.user_id == 5
    assert record.level == CEFRLevel.B1
