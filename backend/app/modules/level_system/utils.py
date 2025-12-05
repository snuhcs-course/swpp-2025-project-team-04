from . import schemas
from enum import Enum
from sqlalchemy.orm import Session
from ..audio.model import GeneratedContent
from dataclasses import dataclass


class CEFRLevel(Enum):
    """CEFR 레벨 정의"""
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"


# TODO: 실제로 저장할 레벨 별 구간값들 정하기
LEVEL_THRESHOLDS = {
    CEFRLevel.A1: 0,
    CEFRLevel.A2: 25,
    CEFRLevel.B1: 50,
    CEFRLevel.B2: 100,
    CEFRLevel.C1: 150,
    CEFRLevel.C2: 200,
}
MIN_SCORE = 0 # 최소 스코어
MAX_SCORE = 300  # 최대 스코어

# 단어 조회(Lookup) 기준 비율
LOOKUP_THRESHOLD_RATIO = 0.1  # 10% (이하: 긍정적, 초과: 부정적)
LOOKUP_HIGH_THRESHOLD_RATIO = 0.15 # 15% (이 이상 초과 시 더 큰 패널티)

# 단어 저장(Save) 기준 비율
SAVE_THRESHOLD_RATIO = 0.05   # 5% (이하: 긍정적, 초과: 부정적)
SAVE_HIGH_THRESHOLD_RATIO = 0.1 # 10% (이 이상 초과 시 더 큰 패널티)

def get_cefr_level_from_score(score: float) -> CEFRLevel:
    """
    스코어(0~300)로부터 CEFR 레벨(A1~C2)을 반환합니다.
    
    Args:
        score: 0~300 범위의 레벨 스코어
        
    Returns:
        CEFRLevel Enum 객체
    """
    # 스코어를 클램프
    score = max(MIN_SCORE, min(MAX_SCORE, score))
    
    # 레벨 결정 (내림차순으로 체크)
    if score >= LEVEL_THRESHOLDS[CEFRLevel.C2]:
        return CEFRLevel.C2
    elif score >= LEVEL_THRESHOLDS[CEFRLevel.C1]:
        return CEFRLevel.C1
    elif score >= LEVEL_THRESHOLDS[CEFRLevel.B2]:
        return CEFRLevel.B2
    elif score >= LEVEL_THRESHOLDS[CEFRLevel.B1]:
        return CEFRLevel.B1
    elif score >= LEVEL_THRESHOLDS[CEFRLevel.A2]:
        return CEFRLevel.A2
    else:
        return CEFRLevel.A1


def get_average_score_and_level(
    lexical_score: float,
    syntactic_score: float,
    speed_score: float
) -> dict[str, float | CEFRLevel]:
    """
    3개의 레벨 스코어를 받아 평균 스코어와 평균 CEFR 레벨을 반환합니다.
    
    Args:
        lexical_score: 어휘 레벨 스코어 
        syntactic_score: 구문 레벨 스코어 
        speed_score: 속도 레벨 스코어 
    
    Returns:
        {
            "average_score": 평균 스코어 (float),
            "average_level": CEFRLevel Enum 객체
        }
    """
    # 평균 계산
    average_score = round((lexical_score + syntactic_score + speed_score) / 3, 1)
    
    # 평균 스코어로부터 레벨 결정
    average_level = get_cefr_level_from_score(average_score)
    
    return {
        "average_score": average_score,
        "average_level": average_level
    }


@dataclass
class NormalizedFeedback:
    """정규화된 피드백 데이터를 담는 데이터 클래스"""
    pause: float
    rewind: float
    vocab_lookup: float
    vocab_save: float
    understanding: float
    speed: float


def _feedback_to_vector(normalized_feedback: NormalizedFeedback) -> list[float]:
    return [
        normalized_feedback.pause,
        normalized_feedback.rewind,
        normalized_feedback.vocab_lookup,
        normalized_feedback.vocab_save,
        normalized_feedback.understanding,
        normalized_feedback.speed,
    ]


def _compute_levels_delta_from_weights(
    vector: list[float],
    W: list[list[float]],
    clip_ranges: dict[str, tuple[float, float]] | None = None,
) -> tuple[float, float, float]:
    """
    6차원 피드백 벡터와 6x3 weight matrix W를 받아 3차원 결과를 계산합니다. 이는 각 레벨 별 변화량입니다.
    각 결과(lexical, syntactic, speed)에 대해 clip_ranges로 개별 클리핑 가능.

    clip_ranges 예시:
        {
            "lexical": (-2.0, 2.0),
            "syntactic": (-1.5, 1.5),
            "speed": (-1.0, 1.0)
        }
    """

    if len(vector) != 6:
        raise ValueError("feedback vector must be length 6")
    if len(W) != 6 or any(len(row) != 3 for row in W):
        raise ValueError("weight matrix W must be 6x3")

    # 결과 초기화
    res = [0.0, 0.0, 0.0]

    # 가중합 계산
    for i in range(6):
        for j in range(3):
            res[j] += vector[i] * W[i][j]

    # 반올림
    res = [round(v, 2) for v in res]

    # 개별 클리핑
    if clip_ranges:
        lexical_min, lexical_max = clip_ranges.get("lexical", (-float("inf"), float("inf")))
        syntactic_min, syntactic_max = clip_ranges.get("syntactic", (-float("inf"), float("inf")))
        speed_min, speed_max = clip_ranges.get("speed", (-float("inf"), float("inf")))

        res[0] = max(lexical_min, min(lexical_max, res[0]))
        res[1] = max(syntactic_min, min(syntactic_max, res[1]))
        res[2] = max(speed_min, min(speed_max, res[2]))

    return res[0], res[1], res[2]


def normalize_vocab_factor(
    db: Session,
    generated_content_id: int,
    vocab_lookup_cnt: int,
    vocab_save_cnt: int,
) -> tuple[float, float]:
   # --- 0. script_wc 조회 ---
    # generated_content_id를 사용해 DB에서 스크립트의 총 단어 수(script_wc)를 가져옵니다.
    content = db.query(GeneratedContent).filter(GeneratedContent.generated_content_id == generated_content_id).first()
    if not content:
        raise ValueError(f"Generated content with id {generated_content_id} not found")
    if not content.script_data:
        raise ValueError(f"Script data is missing for generated content id {generated_content_id}")
    
    # script_data에서 단어 수 계산
    script_wc = len(content.script_data.split())

    # --- 1. 초기 설정 ---
    lexical_level_update_lookup = 0.0
    lexical_level_update_save = 0.0

    # 기준선 계산
    lookup_threshold = script_wc * LOOKUP_THRESHOLD_RATIO
    lookup_high_threshold = script_wc * LOOKUP_HIGH_THRESHOLD_RATIO

    save_threshold = script_wc * SAVE_THRESHOLD_RATIO
    save_high_threshold = script_wc * SAVE_HIGH_THRESHOLD_RATIO


    # --- 2. '단어 조회(vocab_lookup)' 점수 계산 ---
    if vocab_lookup_cnt == 0:
        lexical_level_update_lookup = +1.0

    elif vocab_lookup_cnt < lookup_threshold:  # (예: 1% ~ 9.9%)
        # "정상"보다 적게 조회함 -> 스크립트가 쉬웠음.
        lexical_level_update_lookup = +0.5

    else:  # (10% 이상 조회)
        # "정상"보다 많이 조회함 -> 스크립트가 어려웠음.
        
        # 15% 이상 조회 시 더 큰 패널티(-1)를 부여
        if vocab_lookup_cnt > lookup_high_threshold:
            lexical_level_update_lookup = -1.0
        else:  # (10% ~ 15% 조회)
            lexical_level_update_lookup = -0.5


    # --- 3. '단어 저장(vocab_save)' 점수 계산 ---
    # (참고: 이 로직은 저장을 '부정적 신호'로 간주합니다)

    if vocab_save_cnt == 0:
        lexical_level_update_save = +1.0

    elif vocab_save_cnt < save_threshold:  # (예: 1% ~ 4.9%)
        # "정상"보다 적게 저장함.
        lexical_level_update_save = +0.5

    else:  # (5% 이상 저장)
        # "정상"보다 많이 저장함.
        
        # 10% 이상 저장 시 더 큰 패널티(-1)를 부여
        if vocab_save_cnt > save_high_threshold:
            lexical_level_update_save = -1.0
        else:  # (5% ~ 10% 저장)
            lexical_level_update_save = -0.5

    # 두 개의 숫자 값을 튜플로 반환
    return lexical_level_update_lookup, lexical_level_update_save



def normalize_interaction_factor(
        pause_cnt: int,
        rewind_cnt: int,
        )-> tuple[float, float]:
    
    return pause_cnt-2, rewind_cnt-2

def normalize_understanding_factor(understanding_difficulty: int) -> float: 
    # unterstanding은 0 1 2(적당) 3 4(매우 쉬움)로 온다고 가정
    return understanding_difficulty-2

def normalize_speed_factor(speed_difficulty: int) -> float: 
    # speed_difficulty는 0 1 2(적당) 3 4(매우 느림)으로 온다고 가정
    return speed_difficulty-2



def get_speed_from_level_score(level_score: float) -> float:

    if level_score <= MIN_SCORE:
        return 0.70
    
    if level_score >= 200:
        return 1.15

    # (start_score, end_score, start_speed, end_speed)
    LEVEL_RANGES = [
        (0,   25,  0.70, 0.80),  # A1
        (25,  50,  0.80, 0.90),  # A2
        (50,  100, 0.90, 1.00),  # B1
        (100, 150, 1.00, 1.1),  # B2
        (150, 200, 1.1, 1.15),  # C1
    ]


    # Linear interpolation in the correct range
    for start_s, end_s, start_v, end_v in LEVEL_RANGES:
        if start_s <= level_score <= end_s:
            ratio = (level_score - start_s) / (end_s - start_s)
            value = start_v + (end_v - start_v) * ratio
            return round(value, 2)

    return 1.00