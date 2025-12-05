from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from ...core.config import Base


class VocabEntry(Base):
    __tablename__ = "vocab_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    word = Column(String(255), nullable=False, index=True)
    example_sentence = Column(Text, nullable=True)
    example_sentence_url = Column(String(512), nullable=True)
    pos = Column(String(64), nullable=True)
    meaning = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
