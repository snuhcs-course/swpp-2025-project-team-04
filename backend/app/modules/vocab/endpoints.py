from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy.orm import Session
from ...core.config import get_db
from ..audio.model import GeneratedContent
from . import crud as vocab_crud
from . import schemas as vocab_schemas
from ...core.auth import verify_token, TokenType
from ..users.crud import get_user_by_username
from ...core.exceptions import (
    InvalidAuthHeaderException,
    UserNotFoundException,
    ScriptVocabsNotFoundException,
)
import time
from ...modules.audio.utils import get_elevenlabs_client
from ...core.s3setting import generate_example_audio_key, upload_audio_to_s3


router = APIRouter(prefix="/vocabs", tags=["vocab"])


def get_current_user(authorization: str = Header(), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise InvalidAuthHeaderException()

    access_token = authorization[7:]

    token_data = verify_token(access_token, TokenType.ACCESS_TOKEN)
    username = token_data["username"]

    user = get_user_by_username(db, username)
    if not user:
        raise UserNotFoundException()

    return user

@router.get("/me", response_model=list[vocab_schemas.VocabEntryResponse])
def get_my_vocab(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    entries = vocab_crud.get_vocab_for_user(db, current_user.id)
    return entries


@router.get("/{content_id}/sentences/{index}")
def get_contextual_word(content_id: int, index: int, word: str | None = None, db: Session = Depends(get_db)):
    """Return contextual JSON for a single word inside a sentence.

    Optional query param `word` can be provided: /.../sentences/{index}?word=enjoy
    If `word` is provided, return only that word's contextual JSON; otherwise return the whole sentence object.
    """
    content = (
        db.query(GeneratedContent)
        .filter(GeneratedContent.generated_content_id == content_id)
        .first()
    )

    if not content:
        raise HTTPException(status_code=404, detail="generated content not found")

    script_vocabs = content.script_vocabs
    if not script_vocabs:
        raise ScriptVocabsNotFoundException()

    sentences = script_vocabs.get("sentences") if isinstance(script_vocabs, dict) else None
    if not sentences or not isinstance(sentences, list):
        raise HTTPException(status_code=404, detail="no sentences found in script_vocabs")

    # find sentence by its 'index' field
    target_sentence = None
    for sent in sentences:
        # each sentence is expected to have an 'index' field
        if sent.get("index") == index:
            target_sentence = sent
            break

    if not target_sentence:
        raise HTTPException(status_code=404, detail="sentence index not found")

    # If no specific word requested, return full sentence (backwards-compatible)
    if not word:
        return target_sentence

    requested_word = word
    words = target_sentence.get("words") or []
    # case-insensitive match to the 'word' field
    for w in words:
        if isinstance(w.get("word"), str) and w.get("word").lower() == requested_word.lower():
            return w

    # not found
    raise HTTPException(status_code=404, detail="word not found in sentence")



@router.post("/{content_id}/sentences/{index}", status_code=201, responses={404: {"description": "not found"}})
def add_word_to_vocab(
    content_id: int,
    index: int,
    request: vocab_schemas.AddVocabRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Add a word to the current user's personal vocab,
    and generate TTS for the example sentence using ElevenLabs (generator-safe).
    """

    # --- find target sentence ---
    content = db.query(GeneratedContent).filter(
        GeneratedContent.generated_content_id == content_id
    ).first()
    if not content:
        raise HTTPException(status_code=404, detail="generated content not found")

    script_vocabs = content.script_vocabs
    if not script_vocabs or not isinstance(script_vocabs, dict):
        raise ScriptVocabsNotFoundException()

    sentences = script_vocabs.get("sentences")
    if not sentences or not isinstance(sentences, list):
        raise HTTPException(status_code=404, detail="no sentences found in script_vocabs")

    target_sentence = next((s for s in sentences if s.get("index") == index), None)
    if not target_sentence:
        raise HTTPException(status_code=404, detail="sentence index not found")

    # --- find target word ---
    requested_word = request.word
    word_obj = next(
        (
            {k: v for k, v in w.items() if k in ("word", "pos", "meaning")}
            for w in target_sentence.get("words", [])
            if isinstance(w.get("word"), str)
            and w.get("word").lower() == requested_word.lower()
        ),
        None,
    )
    if not word_obj:
        raise HTTPException(status_code=404, detail="word not found in sentence")

    # --- senetence audio generation ---
    # TODO: 비동기로 전환
    text = target_sentence.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="sentence text is empty")

    print(f"[DEBUG] Generating example TTS for: '{text}'")
    start_time = time.time()
    audio_url = None

    try:
        eleven_client = get_elevenlabs_client()

        audio_stream = eleven_client.text_to_speech.convert(
            voice_id="EXAVITQu4vr4xnSDxMaL",  # Rachel
            text=text,
            model_id="eleven_multilingual_v2",
        )

        audio_bytes = b"".join(chunk for chunk in audio_stream)
        elapsed_tts = time.time() - start_time
        print(f"[TIMER] Example TTS took {elapsed_tts:.2f}s")
        print(f"[DEBUG] Generated audio size: {len(audio_bytes) / 1024:.2f} KB")

        # --- S3 upload ---
        key = generate_example_audio_key("mp3")
        audio_url = upload_audio_to_s3(audio_bytes, key)
        print(f"[DEBUG] Uploaded to S3: {audio_url}")

    except Exception as e:
        print(f"[ERROR] ElevenLabs TTS failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {e}")

    # --- save vocab entries to DB ---
    vocab_crud.add_vocab_entry(
        db,
        user_id=current_user.id,
        word=request.word,
        example_sentence=text,
        pos=word_obj.get("pos"),
        meaning=word_obj.get("meaning"),
        example_sentence_url=audio_url,
    )

    print(f"[DEBUG] Inserted vocab entry for '{requested_word}' with TTS URL.")
    return Response(status_code=201)


@router.delete("/me/{entry_id}", status_code=204)
def delete_my_vocab_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Delete a vocab entry from the current user's vocab list.

    Returns 204 if successful, 404 if entry not found or doesn't belong to user.
    """
    deleted = vocab_crud.delete_vocab_entry(db, entry_id=entry_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="vocab entry not found")
    return Response(status_code=204)


@router.get("/{generated_content_id}")
def get_script_vocabs(generated_content_id: int, db: Session = Depends(get_db)):
    """Return the script_vocabs JSON stored on GeneratedContent.

    If the GeneratedContent or its script_vocabs are not present,
    raise the appropriate exception.
    """
    content = (
        db.query(GeneratedContent)
        .filter(GeneratedContent.generated_content_id == generated_content_id)
        .first()
    )

    if not content:
        raise HTTPException(status_code=404, detail="generated content not found")

    script_vocabs = content.script_vocabs
    if not script_vocabs:
        raise ScriptVocabsNotFoundException()

    return script_vocabs
