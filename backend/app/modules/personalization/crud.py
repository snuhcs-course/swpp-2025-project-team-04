from collections import defaultdict
from typing import Mapping, Sequence

from sqlalchemy.orm import Session

from .models import CEFRLevel, LevelTestScript, UserLevelHistory


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


def insert_level_history(db: Session, *, user_id: int, level: CEFRLevel) -> UserLevelHistory:
    record = UserLevelHistory(user_id=user_id, level=level)
    db.add(record)
    return record
