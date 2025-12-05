from __future__ import annotations

import sys
from importlib import util as importlib_util, import_module
from pathlib import Path
from types import SimpleNamespace, ModuleType

def _ensure_level_management_models():
    package_name = "app.modules.level_management"
    models_name = f"{package_name}.models"
    if models_name in sys.modules:
        return
    base_dir = Path(__file__).resolve().parents[4]
    package = ModuleType(package_name)
    package.__path__ = [str((base_dir / "app/modules/level_management").resolve())]
    sys.modules[package_name] = package
    spec = importlib_util.spec_from_file_location(
        models_name,
        (base_dir / "app/modules/level_management/models.py").resolve(),
    )
    module = importlib_util.module_from_spec(spec)
    sys.modules[models_name] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)


_ensure_level_management_models()

from app.modules.audio import endpoints as audio_endpoints


def _fake_user():
    return SimpleNamespace(id=7, username="tester")


def test_list_audio_history_endpoint(monkeypatch, sqlite_session):
    monkeypatch.setattr(
        audio_endpoints.AudioService.AudioService,
        "list_user_audio_history",
        lambda *args, **kwargs: [
            {
                "generated_content_id": 1,
                "user_id": 7,
                "title": "Story",
                "audio_url": "https://cdn/1.mp3",
                "script_data": "script",
                "response_json": {"sentences": []},
                "script_vocabs": {},
                "created_at": __import__("datetime").datetime.utcnow(),
                "updated_at": __import__("datetime").datetime.utcnow(),
            }
        ],
    )
    monkeypatch.setattr(
        audio_endpoints.AudioService.AudioService,
        "count_user_audio_history",
        lambda *args, **kwargs: 1,
    )

    payload = audio_endpoints.list_audio_history(
        current_user=_fake_user(),
        db=sqlite_session,
        limit=10,
        offset=0,
    )
    assert payload["total"] == 1
    assert payload["items"][0]["generated_content_id"] == 1


def test_get_audio_content_endpoint(monkeypatch, sqlite_session):
    crud_module = import_module("app.modules.audio.crud")

    def fake_get_generated_content_by_id(db, content_id):
        return SimpleNamespace(response_json={"audio_url": "https://audio"})

    monkeypatch.setattr(crud_module, "get_generated_content_by_id", fake_get_generated_content_by_id)
    response = audio_endpoints.get_audio_content_by_id(
        generated_content_id=5,
        db=sqlite_session,
    )
    assert response["audio_url"] == "https://audio"


def test_get_audio_file_endpoint(monkeypatch, tmp_path: Path):
    audio_service_module = import_module("app.modules.audio.service")
    monkeypatch.setattr(audio_service_module, "TEMP_AUDIO_DIR", tmp_path, raising=False)
    file_path = tmp_path / "demo.mp3"
    file_path.write_text("content")
    response = __import__("asyncio").run(audio_endpoints.get_audio_file("demo.mp3"))
    assert response.status_code == 200
