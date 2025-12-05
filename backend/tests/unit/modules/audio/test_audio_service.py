from __future__ import annotations

import asyncio
import base64
import sys
import types
from importlib import util as importlib_util
from pathlib import Path
import builtins
import io
import json
from types import SimpleNamespace

import pytest

from fastapi import HTTPException

BASE_DIR = Path(__file__).resolve().parents[4]
LEVEL_MODULE_DIR = BASE_DIR / "app/modules/level_management"


def _ensure_level_management_models_loaded():
    package_name = "app.modules.level_management"
    models_name = f"{package_name}.models"
    if models_name in sys.modules:
        return

    package = types.ModuleType(package_name)
    package.__path__ = [str(LEVEL_MODULE_DIR)]
    sys.modules[package_name] = package

    spec = importlib_util.spec_from_file_location(
        models_name,
        (LEVEL_MODULE_DIR / "models.py").resolve(),
    )
    module = importlib_util.module_from_spec(spec)
    sys.modules[models_name] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)


_ensure_level_management_models_loaded()

from app.modules.audio import service as audio_service_module
from app.modules.audio.schemas import AudioGenerateRequest
from app.modules.audio.service import AudioService


@pytest.fixture()
def fake_user():
    return SimpleNamespace(
        id=1,
        username="tester",
        lexical_level=50.0,
        syntactic_level=45.0,
        speed_level=55.0,
    )


class DummySession:
    def close(self):
        pass


class DummyWebSocket:
    def __init__(self):
        self.messages = []

    async def send_json(self, payload):
        self.messages.append(payload)


async def _fake_generate_script(*_, **__):
    return "Test Title", "Line one.\nLine two."


async def _fake_generate_audio(*_, **__):
    return {
        "audio_base_64": base64.b64encode(b"audio-bytes").decode(),
        "sentences": [{"start_time": 0, "end_time": 120, "text": "Line one."}],
    }


def _patch_audio_pipeline(monkeypatch, sqlite_session):
    fake_voice = {"voice_id": "voice-1", "tags": {"gender": "F", "accent": "none", "style": "calm"}}
    monkeypatch.setattr(AudioService, "_load_voices", staticmethod(lambda: [fake_voice]))
    monkeypatch.setattr(AudioService, "_select_voice_algorithmically", staticmethod(lambda *args, **kwargs: fake_voice))
    monkeypatch.setattr(AudioService, "_generate_script", staticmethod(_fake_generate_script))
    monkeypatch.setattr(AudioService, "_generate_audio_with_timestamps", staticmethod(_fake_generate_audio))
    monkeypatch.setattr(audio_service_module, "generate_s3_object_key", lambda ext="mp3": f"audio/generated.{ext}")
    monkeypatch.setattr(audio_service_module, "upload_audio_to_s3", lambda audio_bytes, key: f"https://cdn/{key}")
    monkeypatch.setattr(audio_service_module, "insert_study_session_from_sentences", lambda user_id, sentences, activity_type="audio": sentences)
    monkeypatch.setattr(audio_service_module, "SessionLocal", lambda: DummySession())

    async def fake_vocab(sentences, content_id):
        return {"sentences": sentences, "content_id": content_id}

    monkeypatch.setattr(audio_service_module.VocabService, "build_contextual_vocab", staticmethod(fake_vocab))

    records = {}

    def fake_insert(db, **kwargs):
        record = SimpleNamespace(generated_content_id=777, **kwargs)
        records["record"] = record
        return record

    def fake_update(db, content_id, audio_url, response_json, duration_seconds=None):
        records["updated"] = {"id": content_id, "audio_url": audio_url, "response": response_json}
        return SimpleNamespace(generated_content_id=content_id, audio_url=audio_url, response_json=response_json)

    monkeypatch.setattr(audio_service_module.crud, "insert_generated_content", fake_insert)
    monkeypatch.setattr(audio_service_module.crud, "update_generated_content_audio", fake_update)
    return records


def test_get_openai_client_uses_settings(monkeypatch):
    captured = {}

    class DummyClient:
        def __init__(self, api_key):
            captured["api_key"] = api_key

    monkeypatch.setattr(audio_service_module, "AsyncOpenAI", DummyClient)
    client = audio_service_module.get_openai_client()
    assert isinstance(client, DummyClient)
    assert captured["api_key"] == audio_service_module.settings.openai_api_key


def test_list_user_audio_history_clamps(monkeypatch):
    called = {}

    def fake_get(db, user_id, limit, offset):
        called["args"] = (limit, offset)
        return ["row"]

    monkeypatch.setattr(audio_service_module.crud, "get_generated_contents_by_user", fake_get)
    db = object()

    rows = AudioService.list_user_audio_history(db, user_id=5, limit=999, offset=-10)

    assert rows == ["row"]
    assert called["args"] == (50, 0)


def test_count_user_audio_history_forwards(monkeypatch):
    called = {}

    def fake_count(db, user_id):
        called["args"] = (db, user_id)
        return 42

    monkeypatch.setattr(audio_service_module.crud, "count_generated_contents_by_user", fake_count)
    assert AudioService.count_user_audio_history(SimpleNamespace(), user_id=7) == 42
    assert called["args"][1] == 7


def test_load_voices_success(monkeypatch):
    payload = json.dumps({"voices": [{"name": "A", "tags": {"accent": "none", "style": "calm"}}]})

    def fake_open(*args, **kwargs):
        return io.StringIO(payload)

    monkeypatch.setattr(builtins, "open", fake_open)
    voices = AudioService._load_voices()
    assert voices[0]["name"] == "A"


def test_load_voices_file_missing(monkeypatch):
    def fake_open(*args, **kwargs):
        raise FileNotFoundError("missing")

    monkeypatch.setattr(builtins, "open", fake_open)

    with pytest.raises(HTTPException):
        AudioService._load_voices()


def test_load_voices_bad_json(monkeypatch):
    def fake_open(*args, **kwargs):
        return io.StringIO("broken")

    monkeypatch.setattr(builtins, "open", fake_open)

    def fake_json_load(_):
        raise json.JSONDecodeError("bad", "broken", 0)

    monkeypatch.setattr(audio_service_module.json, "load", fake_json_load)

    with pytest.raises(HTTPException):
        AudioService._load_voices()


def test_select_voice_prefers_suitable(monkeypatch):
    monkeypatch.setattr(audio_service_module.random, "choice", lambda seq: seq[0])
    user = SimpleNamespace(lexical_level=45.0, syntactic_level=50.0, speed_level=55.0)
    voices = [
        {"name": "Mellow", "tags": {"accent": "none", "style": "mellow"}},
        {"name": "Gritty", "tags": {"accent": "british", "style": "gravelly"}},
    ]

    selected = AudioService._select_voice_algorithmically(voices, user)
    assert selected["name"] in {"Mellow", "Gritty"}


def test_select_voice_fallback_pool(monkeypatch):
    captured = {}

    def fake_choice(seq):
        captured["seq"] = list(seq)
        return seq[0]

    monkeypatch.setattr(audio_service_module.random, "choice", fake_choice)
    monkeypatch.setitem(audio_service_module.ACCENT_SCORES, "british", 120)
    monkeypatch.setitem(audio_service_module.ACCENT_SCORES, "none", 0)
    monkeypatch.setitem(audio_service_module.STYLE_SCORES, "resonant", 0)
    monkeypatch.setitem(audio_service_module.STYLE_SCORES, "calm", 0)
    monkeypatch.setattr(audio_service_module, "ACCENT_WEIGHT", 1.0)
    monkeypatch.setattr(audio_service_module, "STYLE_WEIGHT", 0.0)
    monkeypatch.setitem(audio_service_module.LEVEL_CHALLENGE_MAP, audio_service_module.CEFRLevel.B1, (60, 200))
    user = SimpleNamespace(lexical_level=95.0, syntactic_level=95.0, speed_level=95.0)
    user_level = audio_service_module.get_cefr_level_from_score(
        (user.lexical_level * 0.3) + (user.syntactic_level * 0.2) + (user.speed_level * 0.5)
    )
    monkeypatch.setitem(audio_service_module.LEVEL_CHALLENGE_MAP, user_level, (1000, 1010))
    voices = [
        {"name": "Soft", "tags": {"accent": "none", "style": "calm"}},
        {"name": "Balanced", "tags": {"accent": "british", "style": "resonant"}},
    ]

    selected = AudioService._select_voice_algorithmically(voices, user)
    assert captured["seq"][0]["name"] == "Balanced"
    assert selected["name"] == "Balanced"


def test_select_voice_final_fallback(monkeypatch):
    captured = {"choice": None}

    def fake_choice(seq):
        captured["choice"] = seq[0]
        return seq[0]

    monkeypatch.setattr(audio_service_module.random, "choice", fake_choice)
    user = SimpleNamespace(lexical_level=95.0, syntactic_level=95.0, speed_level=95.0)
    voices = [
        {"name": "Whisper", "tags": {"accent": "none", "style": "calm"}},
    ]

    selected = AudioService._select_voice_algorithmically(voices, user)
    assert selected == captured["choice"] == voices[0]


def test_generate_full_audio_with_timestamps(monkeypatch, sqlite_session, fake_user):
    records = _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="calm", theme="ocean")

    response = asyncio.run(AudioService.generate_full_audio_with_timestamps(request, fake_user))

    assert response["generated_content_id"] == 777
    assert response["audio_url"].startswith("https://cdn/")
    assert records["updated"]["audio_url"] == response["audio_url"]


def test_generate_full_audio_streaming(monkeypatch, sqlite_session, fake_user):
    records = _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="energetic", theme="space")
    ws = DummyWebSocket()

    asyncio.run(AudioService.generate_full_audio_streaming(request, fake_user, ws))

    assert any(msg["type"] == "generation_complete" for msg in ws.messages)
    assert records["updated"]["id"] == 777


def test_generate_full_audio_handles_background_failures(monkeypatch, sqlite_session, fake_user):
    _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="focus", theme="forest")

    def fail_insert(*args, **kwargs):
        raise RuntimeError("db down")

    def fail_task(coro):
        coro.close()
        raise RuntimeError("vocab fail")

    monkeypatch.setattr(audio_service_module.crud, "insert_generated_content", fail_insert)
    monkeypatch.setattr(audio_service_module.asyncio, "create_task", fail_task)
    monkeypatch.setattr(audio_service_module, "insert_study_session_from_sentences", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("stats fail")))

    updated = {}

    def fake_update(db, content_id, audio_url, response_json):
        updated["content_id"] = content_id
        return None

    monkeypatch.setattr(audio_service_module.crud, "update_generated_content_audio", fake_update)

    response = asyncio.run(AudioService.generate_full_audio_with_timestamps(request, fake_user))
    assert response["generated_content_id"] is None
    assert updated["content_id"] is None


def test_generate_full_audio_handles_update_failure(monkeypatch, sqlite_session, fake_user):
    _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="calm", theme="rain")

    def fail_update(*args, **kwargs):
        raise RuntimeError("update failed")

    monkeypatch.setattr(audio_service_module.crud, "update_generated_content_audio", fail_update)

    response = asyncio.run(AudioService.generate_full_audio_with_timestamps(request, fake_user))
    assert "audio_url" in response


def test_generate_full_audio_streaming_insert_failure(monkeypatch, sqlite_session, fake_user):
    _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="serious", theme="city")
    ws = DummyWebSocket()

    def fail_insert(*args, **kwargs):
        raise RuntimeError("db fail")

    monkeypatch.setattr(audio_service_module.crud, "insert_generated_content", fail_insert)

    asyncio.run(AudioService.generate_full_audio_streaming(request, fake_user, ws))
    assert ws.messages[-1]["type"] == "error"


def test_generate_full_audio_streaming_general_error(monkeypatch, sqlite_session, fake_user):
    _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="mystery", theme="labyrinth")
    ws = DummyWebSocket()

    async def fail_script(*args, **kwargs):
        raise RuntimeError("script fail")

    monkeypatch.setattr(AudioService, "generate_audio_script", staticmethod(fail_script))

    asyncio.run(AudioService.generate_full_audio_streaming(request, fake_user, ws))

    assert ws.messages[-1]["type"] == "error"


def test_generate_full_audio_streaming_handles_soft_failures(monkeypatch, sqlite_session, fake_user):
    _patch_audio_pipeline(monkeypatch, sqlite_session)
    request = AudioGenerateRequest(style="steady", theme="mountain")
    ws = DummyWebSocket()

    def fail_task(coro):
        coro.close()
        raise RuntimeError("vocab fail")

    monkeypatch.setattr(audio_service_module.asyncio, "create_task", fail_task)
    monkeypatch.setattr(audio_service_module, "insert_study_session_from_sentences", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("stats fail")))

    def fail_update(*args, **kwargs):
        raise RuntimeError("update boom")

    monkeypatch.setattr(audio_service_module.crud, "update_generated_content_audio", fail_update)

    asyncio.run(AudioService.generate_full_audio_streaming(request, fake_user, ws))
    assert any(msg["type"] == "generation_complete" for msg in ws.messages)


class FakeChatCompletions:
    def __init__(self, responses: list[str]):
        self._responses = responses
        self.calls = 0

    async def create(self, **_):
        text = self._responses[self.calls]
        self.calls += 1
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=text))]
        )


def test_generate_script_retries_until_min_length(monkeypatch, fake_user):
    short_script = "TITLE: Short Story\nHello world."
    long_sentence = " ".join(["story"] * 105)
    long_script = f"TITLE: Epic Voyage\n{long_sentence}. Another closing sentence."

    fake_completions = FakeChatCompletions([short_script, long_script])
    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=fake_completions))
    monkeypatch.setattr(audio_service_module, "get_openai_client", lambda: fake_client)

    selected_voice = {
        "name": "Voyager",
        "tags": {"gender": "F", "accent": "none", "style": "calm"},
    }

    title, script = asyncio.run(AudioService._generate_script(
        style="hopeful",
        theme="voyage",
        user=fake_user,
        selected_voice=selected_voice,
    ))

    assert title == "Epic Voyage"
    assert "TITLE:" not in script
    assert "Another closing sentence" in script
    assert fake_completions.calls == 2  # retried once for the short script


def test_generate_script_raises_after_max_attempts(monkeypatch, fake_user):
    always_short = "TITLE: Tiny Tale\nToo short."
    fake_completions = FakeChatCompletions([always_short] * audio_service_module.MAX_GENERATION_TRIES)
    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=fake_completions))
    monkeypatch.setattr(audio_service_module, "get_openai_client", lambda: fake_client)

    selected_voice = {
        "name": "Strident",
        "tags": {"gender": "M", "accent": "british", "style": "storyteller"},
    }

    with pytest.raises(HTTPException):
        asyncio.run(AudioService._generate_script(
            style="grim",
            theme="adventure",
            user=fake_user,
            selected_voice=selected_voice,
        ))

    assert fake_completions.calls == audio_service_module.MAX_GENERATION_TRIES


def test_generate_script_recovers_from_exception(monkeypatch, fake_user):
    long_sentence = " ".join(["story"] * 105)
    valid_script = f"TITLE: Recovered\n{long_sentence}."
    attempts = {"count": 0}

    class FlakyCompletions:
        async def create(self, **kwargs):
            if attempts["count"] == 0:
                attempts["count"] += 1
                raise RuntimeError("openai hiccup")
            return SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content=valid_script))]
            )

    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FlakyCompletions()))
    monkeypatch.setattr(audio_service_module, "get_openai_client", lambda: fake_client)

    selected_voice = {
        "name": "Resilient",
        "tags": {"gender": "M", "accent": "american_standard", "style": "narration"},
    }

    title, script = asyncio.run(AudioService._generate_script(
        style="joyful",
        theme="comeback",
        user=fake_user,
        selected_voice=selected_voice,
    ))

    assert title == "Recovered"
    assert "Recovered" not in script
    assert attempts["count"] == 1


def test_clean_filename_and_split():
    assert AudioService._clean_filename("Hello!!! World??") == "Hello_World"
    assert AudioService._split_script_by_newlines(None) == []


def test_generate_audio_script_coordinates_components(monkeypatch, fake_user):
    fake_voice = {"voice_id": "v-1", "tags": {"gender": "F", "accent": "none", "style": "calm"}, "name": "Voice"}
    monkeypatch.setattr(AudioService, "_load_voices", staticmethod(lambda: [fake_voice]))
    monkeypatch.setattr(AudioService, "_select_voice_algorithmically", staticmethod(lambda *args, **kwargs: fake_voice))

    async def fake_generate_script(**kwargs):
        return "Title", "Line."

    monkeypatch.setattr(AudioService, "_generate_script", staticmethod(fake_generate_script))

    result = asyncio.run(AudioService.generate_audio_script(AudioGenerateRequest(style="relaxed", theme="sea"), fake_user))
    assert result[0] == "Title"
    assert result[2]["voice_id"] == "v-1"


class _ImmediateLoop:
    async def run_in_executor(self, _executor, func):
        return func()


def test_generate_audio_with_timestamps(monkeypatch):
    captured = {}

    class FakeResponse:
        def __init__(self, payload):
            self._payload = payload

        def model_dump(self):
            return self._payload

    class FakeTextToSpeech:
        def convert_with_timestamps(self, **kwargs):
            captured["kwargs"] = kwargs
            payload = {"audio_base_64": "dGVzdA==", "alignment": {"dummy": True}}
            return FakeResponse(payload)

    fake_client = SimpleNamespace(text_to_speech=FakeTextToSpeech())
    monkeypatch.setattr(audio_service_module, "get_elevenlabs_client", lambda: fake_client)
    monkeypatch.setattr(audio_service_module.asyncio, "get_event_loop", lambda: _ImmediateLoop())

    parsed_sentences = [{"id": 0, "text": "Line", "start_time": 0, "words": ["line"]}]
    monkeypatch.setattr(audio_service_module, "parse_tts_by_newlines", lambda data: parsed_sentences)

    result = asyncio.run(AudioService._generate_audio_with_timestamps("Line", "voice-1", 1.25))

    assert result["audio_base_64"] == "dGVzdA=="
    assert result["sentences"] == parsed_sentences
    assert captured["kwargs"]["voice_id"] == "voice-1"
    assert captured["kwargs"]["text"] == "Line"


def test_generate_audio_with_timestamps_failure(monkeypatch):
    class FakeTextToSpeech:
        def convert_with_timestamps(self, **kwargs):
            raise RuntimeError("boom")

    fake_client = SimpleNamespace(text_to_speech=FakeTextToSpeech())
    monkeypatch.setattr(audio_service_module, "get_elevenlabs_client", lambda: fake_client)
    monkeypatch.setattr(audio_service_module.asyncio, "get_event_loop", lambda: _ImmediateLoop())

    with pytest.raises(HTTPException):
        asyncio.run(AudioService._generate_audio_with_timestamps("Line", "voice-2", 1.0))
