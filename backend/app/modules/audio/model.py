from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func
from ...core.config import Base


class GeneratedContent(Base):
    """
    Persisted audio generation metadata for reuse and auditing.
    """

    __tablename__ = "generated_contents"

    generated_content_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    audio_url = Column(String(512), nullable=True)
    script_data = Column(Text, nullable=True)
    response_json = Column(JSON, nullable=True)
    script_vocabs = Column(JSON, nullable=True)  # ✅ contextual words JSON 저장용
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    @property
    def sentences(self):
        """Expose parsed sentences stored inside response_json."""
        if not self.response_json:
            return None
        if isinstance(self.response_json, dict):
            return self.response_json.get("sentences")
        return None
