from datetime import datetime
from typing import Annotated, List, Optional

from annotated_types import Len, Le, Ge
from pydantic import BaseModel, Field, conint, conlist, field_validator

from .models import CEFRLevel

CEFR_LEVEL_DESCRIPTIONS = {
    CEFRLevel.A1: "천천히·또렷하게 말하면 기본적인 표현 이해",
    CEFRLevel.A2: "일상 대화나 간단 뉴스의 핵심 이해",
    CEFRLevel.B1: "익숙한 주제 대화, TV 프로그램 요지 이해",
    CEFRLevel.B2: "복잡한 강연·라디오·뉴스 전반 이해",
    CEFRLevel.C1: "긴 강연이나 논쟁적 주제도 상세 이해",
    CEFRLevel.C2: "사실상 원어민과 차이 없는 이해력",
}

UnderstandingScore = Annotated[int, Ge(0), Le(100)]
TestsField = Annotated[List["LevelTestItem"], Len(min_length=1, max_length=5)]

class LevelScores(BaseModel):
    level_score: UnderstandingScore
    llm_confidence: UnderstandingScore


class LevelTestItem(BaseModel):
    script_id: str = Field(..., max_length=64)
    understanding: UnderstandingScore


class LevelTestRequest(BaseModel):
    tests: TestsField

    @field_validator("tests")
    @classmethod
    def ensure_valid_scores(cls, tests: List[LevelTestItem]) -> List[LevelTestItem]:
        if not any(item.understanding is not None for item in tests):
            raise ValueError("최소 한 개 이상의 테스트에 이해도 점수가 필요합니다.")
        return tests


class LevelTestResponse(BaseModel):
    level: CEFRLevel
    level_description: str
    scores: LevelScores
    rationale: str = Field(..., max_length=2048)
    updated_at: datetime


class ManualLevelUpdateRequest(BaseModel):
    level: CEFRLevel


class ManualLevelUpdateResponse(BaseModel):
    level: CEFRLevel
    level_description: str
    updated_at: datetime
