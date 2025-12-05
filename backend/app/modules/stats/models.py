from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from ...core.config import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    duration_minutes = Column(Integer, nullable=False)
    activity_type = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Achievement(Base):
    __tablename__ = "achievements"

    code = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    achievement_code = Column(
        String(64),
        ForeignKey("achievements.code"),
        nullable=False,
        index=True,
    )
    achieved_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
