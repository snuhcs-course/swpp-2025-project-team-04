from __future__ import annotations

from pathlib import Path

import pytest

from app.core import llm


def test_prompt_store_loads_and_caches(tmp_path: Path):
    store = llm.PromptStore(tmp_path)
    sample_file = tmp_path / "hello.yaml"
    sample_file.write_text("system: hi\nuser: there\n", encoding="utf-8")

    first = store.load("hello")
    second = store.load("hello")
    assert first.system == "hi"
    assert first is second  # cached via lru_cache


def test_llm_client_generates_json(monkeypatch):
    class FakeCompletion:
        def __init__(self, content):
            self.choices = [type("Choice", (), {"message": type("Msg", (), {"content": content})()})]

    class FakeChat:
        def __init__(self):
            self.completions = self

        def create(self, **kwargs):
            return FakeCompletion('{"result": "ok"}')

    class FakeOpenAI:
        def __init__(self, **kwargs):
            self.chat = FakeChat()

    monkeypatch.setattr(llm, "OpenAI", FakeOpenAI)
    monkeypatch.setattr(llm, "settings", type("Settings", (), {"openai_api_key": "token", "openai_base_url": None})())

    client = llm.OpenAILLMClient()
    content = client.generate_json(model="gpt", system_prompt="s", user_prompt="u")
    assert "result" in content


def test_llm_client_handles_failures(monkeypatch):
    class FailingChat:
        def __init__(self):
            self.completions = self

        def create(self, **kwargs):
            raise RuntimeError("boom")

    class FakeOpenAI:
        def __init__(self, **kwargs):
            self.chat = FailingChat()

    monkeypatch.setattr(llm, "OpenAI", FakeOpenAI)
    monkeypatch.setattr(llm, "settings", type("Settings", (), {"openai_api_key": "token", "openai_base_url": None})())

    client = llm.OpenAILLMClient()
    with pytest.raises(llm.LLMServiceError):
        client.generate_json(model="gpt", system_prompt="s", user_prompt="u", max_retries=2)


def test_llm_client_requires_api_key(monkeypatch):
    monkeypatch.setattr(llm, "settings", type("Settings", (), {"openai_api_key": None, "openai_base_url": None})())
    with pytest.raises(llm.LLMServiceError):
        llm.OpenAILLMClient(api_key=None)
