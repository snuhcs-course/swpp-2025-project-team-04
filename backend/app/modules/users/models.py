from sqlalchemy import Column, DateTime, Enum as SAEnum, Integer, String
from sqlalchemy.sql import func

from ...core.config import Base
from ..personalization.models import CEFRLevel


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    nickname = Column(String(50), nullable=False)

    level = Column(SAEnum(CEFRLevel, name="cefr_level"), nullable=False, default=CEFRLevel.A1)
    level_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
