from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import get_db
from backend.app.modules.users.endpoints import get_current_user
from backend.app.modules.audio.service import AudioService


client = TestClient(app)
TEST_USER = SimpleNamespace(id=777, username="history-tester")


@pytest.fixture(autouse=True)
def override_dependencies():
    def _current_user_override():
        return TEST_USER

    def _get_db_override():
        yield None

    app.dependency_overrides[get_current_user] = _current_user_override
    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.clear()


class DummyGeneratedContent:
    def __init__(self, idx: int, created: datetime):
        self.generated_content_id = idx
        self.user_id = TEST_USER.id
        self.title = f"Story {idx}"
        self.audio_url = f"https://cdn.example.com/audio/{idx}.mp3"
        self.script_data = f"Script {idx}"
        self.sentences = [
            {"id": idx, "start_time": float(idx), "text": f"Sentence {idx}"}
        ]
        self.response_json = {
            "generated_content_id": idx,
            "sentences": self.sentences,
        }
        self.script_vocabs = {"keyword": "value"}
        self.created_at = created
        self.updated_at = created


def test_audio_history_endpoint_returns_paginated_items(monkeypatch):
    created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    dummy_items = [
        DummyGeneratedContent(1, created_at),
        DummyGeneratedContent(2, created_at),
    ]

    def fake_list(db, *, user_id: int, limit: int, offset: int):
        assert user_id == TEST_USER.id
        assert limit == 50  # clamped from 200
        assert offset == 0  # clamped from negative request
        return dummy_items

    def fake_count(db, *, user_id: int):
        assert user_id == TEST_USER.id
        return len(dummy_items)

    monkeypatch.setattr(AudioService, "list_user_audio_history", staticmethod(fake_list))
    monkeypatch.setattr(AudioService, "count_user_audio_history", staticmethod(fake_count))

    response = client.get("/api/v1/audio/history?limit=200&offset=-10")
    assert response.status_code == 200
    payload = response.json()

    assert payload["limit"] == 50
    assert payload["offset"] == 0
    assert payload["total"] == len(dummy_items)
    assert len(payload["items"]) == 2
    assert payload["items"][0]["generated_content_id"] == 1
    assert payload["items"][0]["audio_url"].endswith("1.mp3")
    assert payload["items"][0]["sentences"][0]["id"] == 1


def test_audio_history_endpoint_respects_requested_pagination(monkeypatch):
    observed = {}

    def fake_list(db, *, user_id: int, limit: int, offset: int):
        observed["limit"] = limit
        observed["offset"] = offset
        return []

    def fake_count(db, *, user_id: int):
        return 0

    monkeypatch.setattr(AudioService, "list_user_audio_history", staticmethod(fake_list))
    monkeypatch.setattr(AudioService, "count_user_audio_history", staticmethod(fake_count))

    response = client.get("/api/v1/audio/history?limit=5&offset=10")
    assert response.status_code == 200
    payload = response.json()

    assert observed["limit"] == 5
    assert observed["offset"] == 10
    assert payload["limit"] == 5
    assert payload["offset"] == 10
    assert payload["items"] == []
