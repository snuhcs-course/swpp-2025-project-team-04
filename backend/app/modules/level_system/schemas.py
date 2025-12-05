from typing import Optional, List

from pydantic import BaseModel


# feedback request
class SessionFeedbackRequest(BaseModel):
    generated_content_id: Optional[int] = None  # 피드백을 하는 content_id. 레벨 update 시에 사용 안 될 것 같다.
    pause_cnt: Optional[int] = None  # 재생 중지 카운트
    rewind_cnt: Optional[int] = None  # 되감기 카운트
    vocab_lookup_cnt: Optional[int] = None  # 단어 검색 카운트
    vocab_save_cnt: Optional[int] = None  # 단어를 저장한 카운트
    understanding_difficulty: Optional[int] = None  # 이해도 값(0,1,2,3,4. 4가 가장 이해가 높다)
    speed_difficulty: Optional[int] = None  # 오디오 빠르기 (0,1,2,3,4. 4가 가장 느리다)


# feedback response
class SessionFeedbackResponse(BaseModel):
    lexical_level: float  # 현재 어휘 레벨
    syntactic_level: float  # 현재 문법 레벨
    speed_level: float  # 현재 청취 레벨
    lexical_level_delta: float  # 어휘 레벨 변화량
    syntactic_level_delta: float  # 문법 레벨 변화량
    speed_level_delta: float  # 청취 레벨 변화량


# level-test request
class LevelTestItem(BaseModel):
    script_id: str
    generated_content_id: int
    understanding: int


class LevelTestRequest(BaseModel):
    level: str  # CEFR 레벨 (예: "A1", "B2" 등)
    tests: List[LevelTestItem]


class LevelScore(BaseModel):
    cefr_level: str
    score: float


class LevelTestResponse(BaseModel):
    success: bool = True
    lexical: LevelScore
    syntactic: LevelScore
    auditory: LevelScore
    overall: LevelScore


# manual level request/response
class ManualLevelRequest(BaseModel):
    level: str


class ManualLevelResponse(BaseModel):
    success: bool = True
    lexical: LevelScore
    syntactic: LevelScore
    auditory: LevelScore
    overall: LevelScore

