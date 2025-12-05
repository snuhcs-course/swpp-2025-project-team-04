from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict


class InterestKey(str, Enum):
    POLITICS = "POLITICS"
    ECONOMY = "ECONOMY"
    SOCIETY = "SOCIETY"
    WORLD = "WORLD"
    TECHNOLOGY = "TECHNOLOGY"
    TRAVEL = "TRAVEL"
    FOOD = "FOOD"
    HEALTH = "HEALTH"
    SELF_IMPROVEMENT = "SELF_IMPROVEMENT"
    FINANCE = "FINANCE"
    MOVIES_TV = "MOVIES_TV"
    MUSIC = "MUSIC"
    SPORTS = "SPORTS"
    GAMES = "GAMES"
    ART = "ART"
    SCIENCE = "SCIENCE"
    HISTORY = "HISTORY"
    PHILOSOPHY = "PHILOSOPHY"
    PSYCHOLOGY = "PSYCHOLOGY"
    IT_AI = "IT_AI"
    LANGUAGE = "LANGUAGE"
    ESSAY = "ESSAY"
    INTERVIEW = "INTERVIEW"
    DAILY_LIFE = "DAILY_LIFE"


@dataclass(frozen=True)
class InterestOption:
    category: str
    label: str


THEME_OPTIONS: Dict[InterestKey, InterestOption] = {
    InterestKey.POLITICS: InterestOption(category="시사·뉴스", label="정치"),
    InterestKey.ECONOMY: InterestOption(category="시사·뉴스", label="경제"),
    InterestKey.SOCIETY: InterestOption(category="시사·뉴스", label="사회"),
    InterestKey.WORLD: InterestOption(category="시사·뉴스", label="국제"),
    InterestKey.TECHNOLOGY: InterestOption(category="시사·뉴스", label="테크"),
    InterestKey.TRAVEL: InterestOption(category="라이프스타일", label="여행"),
    InterestKey.FOOD: InterestOption(category="라이프스타일", label="음식"),
    InterestKey.HEALTH: InterestOption(category="라이프스타일", label="건강"),
    InterestKey.SELF_IMPROVEMENT: InterestOption(category="라이프스타일", label="자기계발"),
    InterestKey.FINANCE: InterestOption(category="라이프스타일", label="재테크"),
    InterestKey.MOVIES_TV: InterestOption(category="문화·엔터테인먼트", label="영화/드라마"),
    InterestKey.MUSIC: InterestOption(category="문화·엔터테인먼트", label="음악"),
    InterestKey.SPORTS: InterestOption(category="문화·엔터테인먼트", label="스포츠"),
    InterestKey.GAMES: InterestOption(category="문화·엔터테인먼트", label="게임"),
    InterestKey.ART: InterestOption(category="문화·엔터테인먼트", label="예술"),
    InterestKey.SCIENCE: InterestOption(category="지식·교육", label="과학"),
    InterestKey.HISTORY: InterestOption(category="지식·교육", label="역사"),
    InterestKey.PHILOSOPHY: InterestOption(category="지식·교육", label="철학"),
    InterestKey.PSYCHOLOGY: InterestOption(category="지식·교육", label="심리학"),
    InterestKey.IT_AI: InterestOption(category="지식·교육", label="IT/AI"),
    InterestKey.LANGUAGE: InterestOption(category="지식·교육", label="언어 학습"),
    InterestKey.ESSAY: InterestOption(category="개인 경험·스토리", label="에세이"),
    InterestKey.INTERVIEW: InterestOption(category="개인 경험·스토리", label="인터뷰"),
    InterestKey.DAILY_LIFE: InterestOption(category="개인 경험·스토리", label="일상"),
}


def get_interest_option(key: InterestKey) -> InterestOption:
    return THEME_OPTIONS[key]
