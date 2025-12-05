from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.modules.survey import endpoints as survey_endpoints


def test_get_initial_survey_audio_success(tmp_path: Path):
    app = FastAPI()
    app.include_router(survey_endpoints.router)
    survey_endpoints.TESTSETS_DIR = tmp_path

    file_path = tmp_path / "level_A1_1.wav"
    file_path.write_text("audio")

    client = TestClient(app)
    resp = client.get("/initial-survey/A1/1")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"


def test_get_initial_survey_audio_not_found(tmp_path: Path):
    app = FastAPI()
    app.include_router(survey_endpoints.router)
    survey_endpoints.TESTSETS_DIR = tmp_path
    client = TestClient(app)
    resp = client.get("/initial-survey/A2/99")
    assert resp.status_code == 404
