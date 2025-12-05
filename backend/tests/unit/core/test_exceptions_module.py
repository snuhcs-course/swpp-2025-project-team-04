from __future__ import annotations

import asyncio
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, ValidationError, field_validator
from starlette.requests import Request

from app.core import exceptions


class SamplePayload(BaseModel):
    value: int

    @field_validator("value")
    @classmethod
    def ensure_positive(cls, v):
        if v < 0:
            raise exceptions.InvalidAuthHeaderException()
        return v


def _build_app() -> FastAPI:
    app = FastAPI()
    exceptions.register_exception_handlers(app)

    @app.get("/boom")
    def raise_app_exception():
        raise exceptions.UserNotFoundException()

    @app.post("/sample")
    def create_sample(payload: SamplePayload):
        return payload

    @app.post("/auth/login")
    def auth_route(payload: SamplePayload):
        return payload

    return app


def test_to_openapi_examples_groups_by_status_code():
    responses = exceptions.AppException.to_openapi_examples(
        [exceptions.InvalidAuthHeaderException, exceptions.UserNotFoundException]
    )
    assert responses[401]["content"]["application/json"]["examples"]


def test_exception_handlers_json_response():
    app = _build_app()
    client = TestClient(app)
    response = client.get("/boom")
    assert response.status_code == 404
    assert response.json()["custom_code"] == "USER_NOT_FOUND"


def test_validation_error_routes(monkeypatch):
    app = _build_app()
    client = TestClient(app)

    # ValidationError triggered from Pydantic validator returning AppException
    response = client.post("/sample", json={"value": -5})
    assert response.status_code == 401
    assert response.json()["custom_code"] == "INVALID_AUTH_HEADER"

    # Standard validation error on /auth should return plain text
    response = client.post("/auth/login", json={"value": "not-int"})
    assert response.status_code == 422
    assert response.text.strip() != ""

    # Standard 422 JSON response for non-auth route
    response = client.post("/sample", json={"value": "oops"})
    assert response.status_code == 422
    assert "detail" in response.json()


def test_validation_handler_direct():
    app = FastAPI()
    exceptions.register_exception_handlers(app)
    handler = app.exception_handlers[exceptions.ValidationError]

    async def receive():
        return {"type": "http.request"}

    request = Request({"type": "http", "path": "/sample", "method": "POST", "headers": []}, receive)
    dummy_exc = SimpleNamespace(
        raw_errors=[
            SimpleNamespace(exc=exceptions.InvalidCredentialsException())
        ],
        errors=lambda: [{"msg": "Invalid input"}],
    )
    response = asyncio.run(handler(request, dummy_exc))
    assert response.status_code == 401

    request_auth = Request({"type": "http", "path": "/auth/login", "method": "POST", "headers": []}, receive)
    dummy_general = SimpleNamespace(
        raw_errors=[],
        errors=lambda: [{"msg": "bad"}],
    )
    response = asyncio.run(handler(request_auth, dummy_general))
    assert response.status_code == 422


def test_exception_classes_instantiation():
    samples = [
        exceptions.InvalidUsernameFormatException(),
        exceptions.InvalidPasswordFormatException(),
        exceptions.UsernameExistsException(),
        exceptions.AccountDeletionFailedException(),
        exceptions.AuthTokenExpiredException(),
        exceptions.InvalidTokenException(),
        exceptions.ScriptVocabsNotFoundException(),
    ]
    for exc in samples:
        assert isinstance(exc, exceptions.AppException)
