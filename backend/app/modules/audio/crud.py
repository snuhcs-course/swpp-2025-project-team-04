from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from datetime import datetime
from .model import GeneratedContent


def insert_generated_content(
    db: Session,
    *,
    user_id: int,
    title: str,
    script_data: Optional[str] = None,
    audio_url: Optional[str] = None,
    response_json: Optional[Dict[str, Any]] = None,
) -> GeneratedContent:
    record = GeneratedContent(
        user_id=user_id,
        title=title,
        script_data=script_data,
        audio_url=audio_url,
        response_json=response_json,
        script_vocabs=None,  
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_generated_content_vocabs(
    db: Session,
    *,
    content_id: int,
    script_vocabs: Dict[str, Any],
) -> Optional[GeneratedContent]:
    """
    Update the 'script vocabs' field after asynchronous contextual vocab generation is complete.
    """
    content = (
        db.query(GeneratedContent)
        .filter(GeneratedContent.generated_content_id == content_id)
        .first()
    )
    if not content:
        return None

    content.script_vocabs = script_vocabs
    content.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(content)
    return content


def update_generated_content_audio(
    db: Session,
    *,
    content_id: int,
    audio_url: str,
    response_json: Dict[str, Any],
) -> Optional[GeneratedContent]:
    """
    Update audio_url and response_json after ElevenLabs TTS generation.
    """
    content = (
        db.query(GeneratedContent)
        .filter(GeneratedContent.generated_content_id == content_id)
        .first()
    )
    if not content:
        return None

    content.audio_url = audio_url
    content.response_json = response_json
    content.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(content)
    return content


def get_generated_contents_by_user(
    db: Session,
    *,
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> List[GeneratedContent]:
    """
    Fetch paginated GeneratedContent rows for a given user (newest first).
    """
    return (
        db.query(GeneratedContent)
        .filter(GeneratedContent.user_id == user_id)
        .order_by(GeneratedContent.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def count_generated_contents_by_user(
    db: Session,
    *,
    user_id: int,
) -> int:
    """
    Count how many audio contents a given user has generated in total.
    """
    return (
        db.query(func.count(GeneratedContent.generated_content_id))
        .filter(GeneratedContent.user_id == user_id)
        .scalar()
    )


def get_generated_content_by_id(
    db: Session,
    *,
    content_id: int,
) -> Optional[GeneratedContent]:
    """
    Fetch a single GeneratedContent by its ID.
    """
    return (
        db.query(GeneratedContent)
        .filter(GeneratedContent.generated_content_id == content_id)
        .first()
    )
