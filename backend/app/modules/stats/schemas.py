from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from ..level_management.models import CEFRLevel


class DailyStudyMinutes(BaseModel):
    date: date
    minutes: int = Field(ge=0)


class StudyStreakSummary(BaseModel):
    consecutive_days: int = Field(ge=0)
    weekly_total_minutes: int = Field(ge=0)
    daily_minutes: List[DailyStudyMinutes]


class SkillLevel(BaseModel):
    cefr_level: CEFRLevel
    score: float = Field(ge=0, le=300)


class LevelProgress(BaseModel):
    lexical: SkillLevel
    syntactic: SkillLevel
    auditory: SkillLevel
    overall_cefr_level: Optional[SkillLevel] = None
    updated_at: Optional[datetime] = None


class AchievementStatus(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    achieved: bool
    achieved_at: Optional[datetime] = None


class UserStatsResponse(BaseModel):
    streak: StudyStreakSummary
    current_level: LevelProgress
    total_time_spent_minutes: int = Field(ge=0)
    total_days: int = Field(ge=0)
    achievements: List[AchievementStatus]
