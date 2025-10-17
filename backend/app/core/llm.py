from __future__ import annotations

import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Optional

import yaml
from openai import OpenAI

from .config import settings


class LLMServiceError(RuntimeError):
    """Raised when the LLM call fails or returns malformed data."""


@dataclass(frozen=True)
class PromptTemplate:
    system: str
    user: str


class PromptStore:
    def __init__(self, base_path: Path):
        self._base_path = base_path

    @lru_cache(maxsize=64)
    def load(self, name: str) -> PromptTemplate:
        path = self._base_path / f"{name}.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Prompt file not found: {path}")
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle)
        return PromptTemplate(system=data["system"], user=data["user"])


class OpenAILLMClient:
    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: float = 30.0,
    ):
        resolved_key = api_key or settings.openai_api_key
        if not resolved_key:
            raise LLMServiceError("OpenAI API key is not configured.")
        client_kwargs = {"api_key": resolved_key}
        if base_url or settings.openai_base_url:
            client_kwargs["base_url"] = base_url or settings.openai_base_url
        self._client = OpenAI(**client_kwargs)
        self._timeout = timeout_seconds

    def generate_json(
        self,
        *,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_retries: int = 3,
    ) -> str:
        last_error: Optional[Exception] = None
        for attempt in range(1, max_retries + 1):
            try:
                completion = self._client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    timeout=self._timeout,
                )
                choice = completion.choices[0] if completion.choices else None
                content = choice.message.content if choice else None
                if not content:
                    raise LLMServiceError("LLM returned an empty response.")
                return content
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if attempt < max_retries:
                    time.sleep(0.3 * attempt)
                else:
                    break
        raise LLMServiceError("OpenAI completion failed.") from last_error
