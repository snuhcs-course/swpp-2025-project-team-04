from datetime import date, datetime
from typing import Iterable, Mapping, Sequence

from sqlalchemy import func
from sqlalchemy.dialects.mysql import insert
from sqlalchemy.orm import Session

from .models import Achievement, StudySession, UserAchievement


def get_daily_study_minutes(
    db: Session,
    *,
    user_id: int,
    start_at: datetime,
    end_at: datetime,
) -> Mapping[date, int]:
    rows = (
        db.query(
            func.date(StudySession.started_at).label("study_date"),
            func.coalesce(func.sum(StudySession.duration_minutes), 0).label("total_minutes"),
        )
        .filter(
            StudySession.user_id == user_id,
            StudySession.started_at >= start_at,
            StudySession.started_at < end_at,
        )
        .group_by(func.date(StudySession.started_at))
        .all()
    )
    return {row.study_date: int(row.total_minutes) for row in rows}


def get_total_study_minutes(db: Session, *, user_id: int) -> int:
    total = (
        db.query(func.coalesce(func.sum(StudySession.duration_minutes), 0))
        .filter(StudySession.user_id == user_id)
        .scalar()
    )
    return int(total or 0)


def get_total_study_days(db: Session, *, user_id: int) -> int:
    """학습 시간이 0이 아닌 모든 날짜의 개수를 반환"""
    count = (
        db.query(func.count(func.distinct(func.date(StudySession.started_at))))
        .filter(
            StudySession.user_id == user_id,
            StudySession.duration_minutes > 0
        )
        .scalar()
    )
    return int(count or 0)


def get_study_dates_descending(
    db: Session,
    *,
    user_id: int,   
    limit: int,
) -> Sequence[date]:
    rows = (
        db.query(func.date(StudySession.started_at).label("study_date"))
        .filter(StudySession.user_id == user_id)
        .group_by(func.date(StudySession.started_at))
        .order_by(func.date(StudySession.started_at).desc())
        .limit(limit)
        .all()
    )
    return [row.study_date for row in rows]


def ensure_achievements(
    db: Session,
    *,
    definitions: Iterable[dict],
) -> None:
    if not definitions:
        return

    # Convert iterable to list if it isn't already, to be safe for multiple iterations if needed
    # though here we just pass it to values()
    values_list = list(definitions)
    if not values_list:
        return

    stmt = insert(Achievement).values(values_list)
    
    # Update fields if the record already exists (idempotent upsert)
    # This prevents race conditions where multiple processes try to insert the same achievement
    stmt = stmt.on_duplicate_key_update(
        name=stmt.inserted.name,
        description=stmt.inserted.description,
        category=stmt.inserted.category,
    )
    
    db.execute(stmt)
    db.commit()


def list_achievements(db: Session) -> Sequence[Achievement]:
    return db.query(Achievement).order_by(Achievement.code).all()


def list_user_achievements(db: Session, *, user_id: int) -> Sequence[UserAchievement]:
    return (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == user_id)
        .all()
    )


def ensure_user_achievement(
    db: Session,
    *,
    user_id: int,
    achievement_code: str,
) -> UserAchievement:
    record = (
        db.query(UserAchievement)
        .filter(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_code == achievement_code,
        )
        .first()
    )
    if record is not None:
        return record

    record = UserAchievement(
        user_id=user_id,
        achievement_code=achievement_code,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def insert_study_session(
    db: Session,
    *,
    user_id: int,
    duration_minutes: int,
    activity_type: str | None = None,
) -> StudySession:
    """Insert a StudySession record and return it."""
    record = StudySession(
        user_id=user_id,
        duration_minutes=duration_minutes,
        activity_type=activity_type,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
