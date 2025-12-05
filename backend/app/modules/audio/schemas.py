from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class AudioGenerateRequest(BaseModel):
    """
    Request body for the /audio/generate endpoint.
    """
    style: str = Field(..., example="podcast")
    theme: str = Field(..., example="sports")

class SentenceTimestamp(BaseModel):
    """
    Individual sentence with timestamp information
    """
    id: int
    start_time: float
    text: str

class FinalAudioResponse(BaseModel):
    """
    Final response with audio file URL and sentence timestamps
    """
    generated_content_id: int
    title: str
    audio_url: str
    sentences: List[SentenceTimestamp]


class StoredAudioResponse(BaseModel):
    """Stored response payload for history view (fields may be missing)."""
    generated_content_id: Optional[int] = None
    title: Optional[str] = None
    audio_url: Optional[str] = None
    sentences: Optional[List[SentenceTimestamp]] = None

class GeneratedScriptResponse(BaseModel):
    """
    A temporary response model to show the output of Part 1.
    This will eventually be replaced by the final audio response.
    """
    title: str
    selected_voice_id: str
    selected_voice_name: str
    script: str


class GeneratedContentListItem(BaseModel):
    """
    Summary of a GeneratedContent row for list views.
    """
    model_config = ConfigDict(from_attributes=True)

    generated_content_id: int
    user_id: int
    title: str
    audio_url: Optional[str] = None
    script_data: Optional[str] = None
    sentences: Optional[List[SentenceTimestamp]] = None
    created_at: datetime
    updated_at: datetime


class AudioHistoryListResponse(BaseModel):
    """
    Paginated response containing a user's previously generated audios.
    """
    items: List[GeneratedContentListItem]
    total: int
    limit: int
    offset: int
