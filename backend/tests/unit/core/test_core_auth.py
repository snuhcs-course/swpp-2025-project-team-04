from datetime import datetime, timedelta, timezone
import pytest
from jose import jwt

from backend.app.core import auth
from backend.app.core.exceptions import (
    AuthTokenExpiredException,
    InvalidTokenException,
    InvalidTokenTypeException,
)


TEST_SECRET_KEY = "unit-test-secret"


@pytest.fixture(autouse=True)
def override_secret_key(monkeypatch):
    original_secret = auth.SECRET_KEY
    monkeypatch.setattr(auth, "SECRET_KEY", TEST_SECRET_KEY)
    yield
    monkeypatch.setattr(auth, "SECRET_KEY", original_secret)


def test_hash_and_verify_password():
    password = "StrongPass123!"

    hashed_password = auth.hash_password(password)

    assert hashed_password != password
    assert auth.verify_password(password, hashed_password)
    assert not auth.verify_password("WrongPass123!", hashed_password)


def test_create_access_token_contains_expected_claims():
    token = auth.create_access_token({"sub": "tester"}, auth.TokenType.ACCESS_TOKEN)
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == "tester"
    assert payload["type"] == auth.TokenType.ACCESS_TOKEN.value
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    assert expires_at > datetime.now(timezone.utc)


def test_verify_token_returns_payload_details():
    token = auth.create_access_token({"sub": "tester"}, auth.TokenType.ACCESS_TOKEN)

    result = auth.verify_token(token, auth.TokenType.ACCESS_TOKEN)

    assert result["username"] == "tester"
    assert result["token_type"] == auth.TokenType.ACCESS_TOKEN.value
    assert "payload" in result


def test_verify_token_raises_for_invalid_type():
    token = auth.create_access_token({"sub": "tester"}, auth.TokenType.ACCESS_TOKEN)

    with pytest.raises(InvalidTokenTypeException):
        auth.verify_token(token, auth.TokenType.REFRESH_TOKEN)


def test_verify_token_raises_for_missing_username():
    token = auth.create_access_token({}, auth.TokenType.ACCESS_TOKEN)

    with pytest.raises(InvalidTokenException):
        auth.verify_token(token, auth.TokenType.ACCESS_TOKEN)


def test_verify_token_raises_for_expired_signature():
    expired_payload = {
        "sub": "tester",
        "type": auth.TokenType.ACCESS_TOKEN.value,
        "exp": int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()),
    }
    token = jwt.encode(expired_payload, auth.SECRET_KEY, algorithm=auth.ALGORITHM)

    with pytest.raises(AuthTokenExpiredException):
        auth.verify_token(token, auth.TokenType.ACCESS_TOKEN)


def test_verify_token_raises_for_invalid_signature():
    payload = {
        "sub": "tester",
        "type": auth.TokenType.ACCESS_TOKEN.value,
        "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
    }
    token = jwt.encode(payload, "other-secret", algorithm=auth.ALGORITHM)

    with pytest.raises(InvalidTokenException):
        auth.verify_token(token, auth.TokenType.ACCESS_TOKEN)
