from collections import defaultdict
from typing import Mapping, Sequence

from sqlalchemy.orm import Session

from .models import CEFRLevel, LevelTestScript, UserLevelHistory
from ..audio.model import GeneratedContent


def get_scripts_by_ids(db: Session, script_ids: Sequence[str]) -> Mapping[str, LevelTestScript]:
    if not script_ids:
        return {}
    rows = (
        db.query(LevelTestScript)
        .filter(LevelTestScript.id.in_(script_ids))
        .all()
    )
    lookup = defaultdict(lambda: None)
    for row in rows:
        lookup[row.id] = row
    return lookup


def get_generated_contents_by_ids(db: Session, content_ids: Sequence[int]) -> Mapping[int, GeneratedContent]:
    if not content_ids:
        return {}
    rows = (
        db.query(GeneratedContent)
        .filter(GeneratedContent.generated_content_id.in_(content_ids))
        .all()
    )
    lookup = defaultdict(lambda: None)
    for row in rows:
        lookup[row.generated_content_id] = row
    return lookup


def insert_level_history(
    db: Session,
    *,
    user_id: int,
    level: CEFRLevel,
    level_score: int | None = None,
    llm_confidence: int | None = None,
    average_understanding: int | None = None,
    sample_count: int | None = None,
) -> UserLevelHistory:
    record = UserLevelHistory(
        user_id=user_id,
        level=level,
        level_score=level_score,
        llm_confidence=llm_confidence,
        average_understanding=average_understanding,
        sample_count=sample_count,
    )
    db.add(record)
    return record
