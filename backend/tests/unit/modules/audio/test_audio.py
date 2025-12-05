import asyncio
from types import SimpleNamespace

import pytest

from backend.app.modules.audio import utils as audio_utils
from backend.app.modules.audio.service import AudioService
from backend.app.modules.audio.utils import parse_tts_by_newlines


FAKE_TTS_RESPONSE = {
    "audio_base64": "FAKE_AUDIO_DATA",
    "alignment": {
        "characters": [
            "G","o","o","d"," ","m","o","r","n","i","n","g","!","\n",
            "H","o","w"," ","a","r","e"," ","y","o","u"," ","t","o","d","a","y","?","\n",
            "I"," ","h","o","p","e"," ","y","o","u"," ","s","l","e","p","t"," ","w","e","l","l","."
        ],
        "character_start_times_seconds": [
            0.0,0.05,0.09,0.12,0.16,0.20,0.25,0.29,0.33,0.36,0.40,0.45,0.49,0.55,
            0.60,0.65,0.70,0.73,0.77,0.81,0.85,0.89,0.93,0.97,1.01,1.05,1.09,1.13,1.17,1.21,1.25,1.30,1.35,
            1.40,1.45,1.49,1.54,1.58,1.62,1.66,1.70,1.74,1.78,1.82,1.86,1.90,1.95,2.00,2.04,2.08,2.12,2.16,2.20,2.24,2.28
        ],
        "character_end_times_seconds": [
            0.05,0.09,0.12,0.16,0.20,0.25,0.29,0.33,0.36,0.40,0.45,0.49,0.55,0.60,
            0.65,0.70,0.73,0.77,0.81,0.85,0.89,0.93,0.97,1.01,1.05,1.09,1.13,1.17,1.21,1.25,1.30,1.35,1.40,
            1.45,1.49,1.54,1.58,1.62,1.66,1.70,1.74,1.78,1.82,1.86,1.90,1.95,2.00,2.04,2.08,2.12,2.16,2.20,2.24,2.28,2.32
        ]
    }
}

def test_parse_tts_by_newlines_basic():
    """Verify that the parser correctly splits text by newline characters and extracts start times and words."""
    sentences_response = parse_tts_by_newlines(FAKE_TTS_RESPONSE)
    print(sentences_response)
    # Result should be a list of sentences
    assert isinstance(sentences_response, list)
    assert len(sentences_response) == 3  # Expect three sentences

    # Validate structure and field types
    for sentence in sentences_response:
        assert set(sentence.keys()) == {"id", "start_time", "text", "words"}
        assert isinstance(sentence["words"], list)
        for w in sentence["words"]:
            assert isinstance(w, str)

        assert isinstance(sentence["id"], int)
        assert isinstance(sentence["start_time"], float)
        assert isinstance(sentence["text"], str)
        assert len(sentence["text"]) > 0

    assert sentences_response[0]["text"].startswith("Good morning")
    assert sentences_response[1]["text"].startswith("How are you")
    assert sentences_response[2]["text"].startswith("I hope you")

    # --- 🔹 Expected word lists for each sentence ---
    expected_words = [
        ["good", "morning"],
        ["how", "are", "you", "today"],
        ["i", "hope", "you", "slept", "well"],
    ]

    # Verify exact match for each sentence's words
    for i, expected in enumerate(expected_words):
        assert sentences_response[i]["words"] == expected, f"Sentence {i} words mismatch: {sentences_response[i]['words']} != {expected}"

    # Verify all unique words combined
    all_expected_words = [w for group in expected_words for w in group]
    all_extracted_words = [w for s in sentences_response for w in s["words"]]
    assert all_extracted_words == all_expected_words, f"Global word list mismatch: {all_extracted_words}"



def test_parse_tts_by_newlines_trailing_newline():
    """Ensure that irregular newline pattern is still parsed correctly."""
    fake_resp = {
        "alignment": {
            "characters": ["\n", "H", "i", "!", "\n","\n", "B", "y", "e", "!","\n"],
            "character_start_times_seconds": [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
            "character_end_times_seconds": [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
        }
    }

    sentences = parse_tts_by_newlines(fake_resp)
    assert len(sentences) == 2
    assert sentences[0]["text"] == "Hi!"
    assert sentences[1]["text"] == "Bye!"


def test_extract_words_and_duration():
    words = audio_utils.extract_words_from_sentence("Don't Stop, Believin'!")
    assert words == ["don't", "stop", "believin"]

    duration = audio_utils.compute_audio_duration_seconds_from_sentences(
        [
            {"start_time": 0, "end_time": "1.5"},
            {"start": 2.2},
            {"end_time_seconds": 3.7},
        ]
    )
    assert duration == 3.7


def test_insert_study_session_from_sentences(monkeypatch, sqlite_session):
    captured = {}

    def fake_session_local():
        return sqlite_session

    def fake_insert(db, user_id, duration_minutes, activity_type):
        captured["args"] = (user_id, duration_minutes, activity_type)

    monkeypatch.setattr(audio_utils, "SessionLocal", fake_session_local)
    monkeypatch.setattr(audio_utils.stats_crud, "insert_study_session", fake_insert)

    sentences = [{"start_time": 0, "end_time": 130}]
    audio_utils.insert_study_session_from_sentences(user_id=7, sentences=sentences, activity_type="audio")

    assert captured["args"] == (7, 3, "audio")


def test_parse_title_and_clean_filename():
    content = "TITLE: Hello\nLine one\nLine two"
    title, script = AudioService._parse_title_and_script(content)
    assert title == "Hello"
    assert "Line one" in script
    assert AudioService._clean_filename("Hi! there??") == "Hi_there"


def test_split_script_by_newlines():
    script = "First line\n\nSecond line\nThird"
    sentences = AudioService._split_script_by_newlines(script)
    assert sentences == ["First line", "Second line", "Third"]


def test_select_voice_algorithmically():
    user = SimpleNamespace(
        lexical_level=30.0,
        syntactic_level=40.0,
        speed_level=60.0,
    )
    voices = [
        {"name": "Calm Voice", "tags": {"accent": "american_standard", "style": "calm"}},
        {"name": "Bold Voice", "tags": {"accent": "british", "style": "gravelly"}},
    ]
    selected = AudioService._select_voice_algorithmically(voices, user)
    assert selected in voices


def test_extract_words_handles_non_string():
    assert audio_utils.extract_words_from_sentence(None) == []
    assert audio_utils.extract_words_from_sentence("  Where's  the  Dog? ") == ["where's", "the", "dog"]


def test_parse_tts_missing_alignment():
    with pytest.raises(ValueError):
        parse_tts_by_newlines({})


def test_parse_tts_skips_blank_sentences():
    resp = {
        "alignment": {
            "characters": ["H", "i", "\n", "\n", "B", "y", "e"],
            "character_start_times_seconds": [0, 0.05, 0.1, 0.2, 0.3, 0.35, 0.4],
        }
    }
    sentences = parse_tts_by_newlines(resp)
    assert len(sentences) == 2


def test_insert_study_session_zero_duration(monkeypatch):
    called = {}
    monkeypatch.setattr(audio_utils, "compute_audio_duration_seconds_from_sentences", lambda _: 0)
    monkeypatch.setattr(audio_utils, "SessionLocal", lambda: None)
    audio_utils.insert_study_session_from_sentences(user_id=1, sentences=[])
    assert called == {}


def test_insert_study_session_handles_exceptions(monkeypatch):
    monkeypatch.setattr(audio_utils, "compute_audio_duration_seconds_from_sentences", lambda _: 120)

    class DummySession:
        def close(self):
            raise RuntimeError("close failed")

    monkeypatch.setattr(audio_utils, "SessionLocal", lambda: DummySession())

    def fake_insert(*args, **kwargs):
        raise RuntimeError("db error")

    monkeypatch.setattr(audio_utils.stats_crud, "insert_study_session", fake_insert)
    audio_utils.insert_study_session_from_sentences(user_id=1, sentences=[{"end": 120}])
