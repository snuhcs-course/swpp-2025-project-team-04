import re
from elevenlabs import ElevenLabs
from ...core.config import settings
from ...core.config import SessionLocal
from ..stats import crud as stats_crud
import math

def get_elevenlabs_client(): # for circular dependency resolution
    return ElevenLabs(api_key=settings.elevenlabs_api_key)

def extract_words_from_sentence(sentence: str) -> list[str]:
    """
    Extract clean English words from a sentence.
    Handles contractions, punctuation, and case normalization.
    Returns a list of lowercase words only.
    """
    if not isinstance(sentence, str):
        return []

    # Normalize whitespace
    sentence = sentence.strip()

    # Keep only letters and apostrophes inside words
    # e.g., "don't", "I'm" should be kept as one word
    tokens = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", sentence)

    # Normalize to lowercase
    words = [t.lower() for t in tokens]

    return words


def parse_tts_by_newlines(tts_response: dict):
    """Return a list of sentence information by splitting the text based on newline ('\n') characters."""
    alignment = tts_response.get("alignment")
    if alignment is None:
        raise ValueError("No alignment or normalized_alignment found in response")

    chars = alignment["characters"]
    starts = alignment["character_start_times_seconds"]

    sentences = []
    current_sentence = ""
    current_start_time = None
    sentence_id = 0

    for i, ch in enumerate(chars):
        if current_start_time is None:
            current_start_time = starts[i]
        current_sentence += ch

        if ch == "\n":
            stripped = current_sentence.strip()
            if stripped:
                sentences.append({
                    "id": sentence_id,
                    "start_time": round(current_start_time, 3),
                    "text": stripped,
                    "words": extract_words_from_sentence(stripped)
                })
                sentence_id += 1
            current_sentence = ""
            current_start_time = None

    if current_sentence.strip():
        stripped = current_sentence.strip()
        sentences.append({
            "id": sentence_id,
            "start_time": round(current_start_time or 0, 3),
            "text": stripped,
            "words": extract_words_from_sentence(stripped)
        })

    return sentences


def compute_audio_duration_seconds_from_sentences(sentences: list[dict]) -> float:
    """Compute approximate audio duration in seconds from sentence timestamp info.

    The function looks for common timestamp keys in each sentence dict in this
    order: 'end', 'end_time', 'end_time_seconds', 'start_time', 'start'. It uses
    the maximum value found as the audio length. Returns 0.0 if nothing found.
    """
    if not sentences:
        return 0.0

    candidates = []
    keys = ("end", "end_time", "end_time_seconds", "start_time", "start")
    for s in sentences:
        for k in keys:
            v = s.get(k)
            if v is None:
                continue
            try:
                fv = float(v)
            except Exception:
                continue
            candidates.append(fv)

    return max(candidates) if candidates else 0.0


def insert_study_session_from_sentences(user_id: int, sentences: list[dict], activity_type: str = "audio") -> None:
    """Compute duration from sentences and insert a StudySession record.

    This helper opens its own DB session and logs failures but does not raise
    so callers (like the audio pipeline) won't fail because of stats errors.
    """
    try:
        last_sec = compute_audio_duration_seconds_from_sentences(sentences)
        if not last_sec or last_sec <= 0:
            return

        duration_minutes = math.ceil(last_sec / 60)

        db = SessionLocal()
        try:
            stats_crud.insert_study_session(
                db,
                user_id=user_id,
                duration_minutes=duration_minutes,
                activity_type=activity_type,
            )
        finally:
            try:
                db.close()
            except Exception:
                pass
    except Exception:
        # swallow exceptions to avoid breaking the main audio pipeline
        return




