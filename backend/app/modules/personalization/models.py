from enum import Enum
from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from ...core.config import Base


class CEFRLevel(str, Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"


class LevelTestScript(Base):
    __tablename__ = "level_test_scripts"

    id = Column(String(64), primary_key=True)
    transcript = Column(Text, nullable=False)
    target_level = Column(SAEnum(CEFRLevel, name="cefr_level"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserLevelHistory(Base):
    __tablename__ = "user_level_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    level = Column(SAEnum(CEFRLevel, name="cefr_level"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
