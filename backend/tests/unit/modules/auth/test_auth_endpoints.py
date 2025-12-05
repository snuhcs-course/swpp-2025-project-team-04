from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core.exceptions import (
    AccountDeletionFailedException,
    InvalidAuthHeaderException,
    InvalidCredentialsException,
    UserNotFoundException,
)
from app.modules.auth import endpoints as auth_endpoints
from app.modules.auth.schemas import ChangePasswordRequest, RefreshTokenRequest


def _make_user():
    return SimpleNamespace(username="tester", hashed_password="hashed", nickname="Tester", id=1)


def test_change_password_invalid_header(sqlite_session):
    request = ChangePasswordRequest(current_password="oldpass1", new_password="newpass1")
    with pytest.raises(InvalidAuthHeaderException):
        auth_endpoints.change_password(request, authorization="Token abc", db=sqlite_session)


def test_change_password_user_not_found(monkeypatch, sqlite_session):
    request = ChangePasswordRequest(current_password="oldpass1", new_password="newpass1")
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": "ghost"})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: None)
    with pytest.raises(UserNotFoundException):
        auth_endpoints.change_password(request, authorization="Bearer token", db=sqlite_session)


def test_change_password_invalid_credentials(monkeypatch, sqlite_session):
    request = ChangePasswordRequest(current_password="oldpass1", new_password="newpass1")
    user = _make_user()
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": user.username})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: user)
    monkeypatch.setattr(auth_endpoints, "verify_password", lambda plain, hashed: False)
    with pytest.raises(InvalidCredentialsException):
        auth_endpoints.change_password(request, authorization="Bearer token", db=sqlite_session)


def test_change_password_success(monkeypatch, sqlite_session):
    request = ChangePasswordRequest(current_password="oldpass1", new_password="newpass1")
    user = _make_user()
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": user.username})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: user)
    monkeypatch.setattr(auth_endpoints, "verify_password", lambda plain, hashed: True)
    hashed_values = {}
    monkeypatch.setattr(auth_endpoints, "hash_password", lambda pwd: f"hashed-{pwd}")

    def fake_update(db, target_user, hashed):
        hashed_values["value"] = hashed

    monkeypatch.setattr(auth_endpoints, "update_user_password", fake_update)
    response = auth_endpoints.change_password(request, authorization="Bearer token", db=sqlite_session)
    assert response.message == "Password updated successfully"
    assert hashed_values["value"] == "hashed-newpass1"


def test_reissue_access_token_user_not_found(monkeypatch, sqlite_session):
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": "ghost"})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: None)
    with pytest.raises(UserNotFoundException):
        auth_endpoints.reissue_access_token(RefreshTokenRequest(refresh_token="refresh"), db=sqlite_session)


def test_reissue_access_token_success(monkeypatch, sqlite_session):
    user = _make_user()
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": user.username})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: user)
    monkeypatch.setattr(auth_endpoints, "create_access_token", lambda data, token_type: f"token-{token_type}")
    resp = auth_endpoints.reissue_access_token(RefreshTokenRequest(refresh_token="refresh"), db=sqlite_session)
    assert resp.access_token == "token-TokenType.ACCESS_TOKEN"


def test_delete_account_invalid_header(sqlite_session):
    with pytest.raises(InvalidAuthHeaderException):
        auth_endpoints.delete_account(authorization="Token xyz", db=sqlite_session)


def test_delete_account_user_not_found(monkeypatch, sqlite_session):
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": "ghost"})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: None)
    with pytest.raises(UserNotFoundException):
        auth_endpoints.delete_account(authorization="Bearer token", db=sqlite_session)


def test_delete_account_failure(monkeypatch, sqlite_session):
    user = _make_user()
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": user.username})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: user)
    monkeypatch.setattr(auth_endpoints, "delete_user", lambda db, username: False)
    with pytest.raises(AccountDeletionFailedException):
        auth_endpoints.delete_account(authorization="Bearer token", db=sqlite_session)


def test_delete_account_success(monkeypatch, sqlite_session):
    user = _make_user()
    monkeypatch.setattr(auth_endpoints, "verify_token", lambda token, token_type: {"username": user.username})
    monkeypatch.setattr(auth_endpoints, "get_user_by_username", lambda db, username: user)
    monkeypatch.setattr(auth_endpoints, "delete_user", lambda db, username: True)
    resp = auth_endpoints.delete_account(authorization="Bearer token", db=sqlite_session)
    assert resp.message == "Account deleted successfully"
