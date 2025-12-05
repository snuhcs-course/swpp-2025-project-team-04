from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from ..level_management.models import CEFRLevel
from .interests import InterestKey


class UserInterest(BaseModel):
    key: InterestKey
    category: str
    label: str

    model_config = ConfigDict(from_attributes=True)


class UpdateUserInterestsRequest(BaseModel):
    interests: List[InterestKey] = Field(default_factory=list)


class UpdateUserInterestsResponse(BaseModel):
    interests: List[UserInterest]


class User(BaseModel):
    id: int
    username: str
    nickname: str
    level: Optional[CEFRLevel] = None
    level_updated_at: Optional[datetime] = None
    initial_level_completed: bool = False
    level_score: Optional[int] = None
    interests: List[UserInterest] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
