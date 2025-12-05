from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.modules.stats import endpoints
from app.core.exceptions import InvalidAuthHeaderException, UserNotFoundException


def test_get_current_user_rejects_invalid_header(monkeypatch):
    with pytest.raises(InvalidAuthHeaderException):
        endpoints.get_current_user("Token abc", db=None)  # type: ignore[arg-type]


def test_get_current_user_returns_user(monkeypatch):
    fake_user = SimpleNamespace(id=1, username="tester")

    def fake_verify(token, token_type):
        assert token == "happy-token"
        return {"username": "tester"}

    def fake_get_user(db, username):
        assert username == "tester"
        return fake_user

    monkeypatch.setattr(endpoints, "verify_token", fake_verify)
    monkeypatch.setattr(endpoints.user_crud, "get_user_by_username", fake_get_user)

    resolved = endpoints.get_current_user("Bearer happy-token", db=None)  # type: ignore[arg-type]
    assert resolved.username == "tester"


def test_get_current_user_missing_user(monkeypatch):
    monkeypatch.setattr(endpoints, "verify_token", lambda *_, **__: {"username": "ghost"})
    monkeypatch.setattr(endpoints.user_crud, "get_user_by_username", lambda *_, **__: None)

    with pytest.raises(UserNotFoundException):
        endpoints.get_current_user("Bearer token", db=None)  # type: ignore[arg-type]


def test_get_stats_delegates_to_service(monkeypatch):
    called = {}

    def fake_get_user_stats(db, user):
        called["db"] = db
        called["user"] = user
        return {"total_time_spent_minutes": 42}

    monkeypatch.setattr(endpoints.service, "get_user_stats", fake_get_user_stats)
    user = SimpleNamespace(id=1)
    response = endpoints.get_stats(current_user=user, db="session")
    assert response["total_time_spent_minutes"] == 42
    assert called["db"] == "session"
