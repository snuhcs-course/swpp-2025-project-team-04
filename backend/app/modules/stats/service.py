from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Sequence, Set

from sqlalchemy.orm import Session

from ..level_management.models import CEFRLevel
from ..level_system.utils import MAX_SCORE, MIN_SCORE, get_cefr_level_from_score, get_average_score_and_level
from ..users.models import User
from . import crud, schemas

_DEFAULT_ACHIEVEMENTS: tuple[Dict[str, str], ...] = (
    {
        "code": "FIRST_SESSION",
        "name": "첫 학습 달성",
        "description": "첫 학습 세션을 완료했습니다.",
        "category": "milestone",
    },
    {
        "code": "STREAK_3",
        "name": "3일 연속 학습",
        "description": "3일 연속으로 학습했습니다.",
        "category": "streak",
    },
    {
        "code": "STREAK_7",
        "name": "7일 연속 학습",
        "description": "일주일 동안 하루도 빠지지 않고 학습했습니다.",
        "category": "streak",
    },
    {
        "code": "STREAK_30",
        "name": "30일 연속 학습",
        "description": "한 달 내내 학습 루틴을 유지했습니다.",
        "category": "streak",
    },
    {
        "code": "TOTAL_60",
        "name": "누적 1시간 학습",
        "description": "누적 60분 이상 학습했습니다.",
        "category": "time",
    },
    {
        "code": "TOTAL_300",
        "name": "누적 5시간 학습",
        "description": "누적 300분 이상 학습했습니다.",
        "category": "time",
    },
    {
        "code": "TOTAL_600",
        "name": "누적 10시간 학습",
        "description": "누적 600분 이상 학습했습니다.",
        "category": "time",
    },
    {
        "code": "TOTAL_1200",
        "name": "누적 20시간 학습",
        "description": "누적 1,200분 이상 학습했습니다.",
        "category": "time",
    },
    {
        "code": "TOTAL_3000",
        "name": "누적 50시간 학습",
        "description": "누적 3,000분 이상 학습했습니다.",
        "category": "time",
    },
)

_DEFAULT_ACHIEVEMENT_LOOKUP = {
    item["code"]: item for item in _DEFAULT_ACHIEVEMENTS
}

_ADVANCED_CEFR_LEVELS = {
    CEFRLevel.B2,
    CEFRLevel.C1,
    CEFRLevel.C2,
}


class StatsService:
    def get_user_stats(
        self,
        *,
        db: Session,
        user: User,
    ) -> schemas.UserStatsResponse:
        now = datetime.now(timezone.utc)
        today = now.date()
        week_start_date = today - timedelta(days=6)
        week_start = self._start_of_day(week_start_date)
        week_end = self._start_of_day(today + timedelta(days=1))

        achievement_defs = self._load_achievement_definitions(db)
        definition_codes = {definition.code for definition in achievement_defs}

        daily_minutes_map = crud.get_daily_study_minutes(
            db,
            user_id=user.id,
            start_at=week_start,
            end_at=week_end,
        )
        daily_minutes = []
        cursor = week_start_date
        while cursor <= today:
            minutes = int(daily_minutes_map.get(cursor, 0))
            daily_minutes.append(
                schemas.DailyStudyMinutes(
                    date=cursor,
                    minutes=max(0, minutes),
                )
            )
            cursor += timedelta(days=1)

        weekly_total_minutes = sum(item.minutes for item in daily_minutes)

        activity_dates = crud.get_study_dates_descending(
            db,
            user_id=user.id,
            limit=60,
        )
        consecutive_days = self._calculate_streak(activity_dates)

        total_time_spent = crud.get_total_study_minutes(db, user_id=user.id)
        total_days = crud.get_total_study_days(db, user_id=user.id)

        skill_levels = self._build_skill_levels(user)
        
        # Calculate overall CEFR level using get_average_score_and_level
        overall_result = get_average_score_and_level(
            skill_levels["lexical"].score,
            skill_levels["syntactic"].score,
            skill_levels["auditory"].score
        )
        overall_skill_level = schemas.SkillLevel(
            cefr_level=CEFRLevel(overall_result["average_level"].value),
            score=overall_result["average_score"]
        )

        unlock_candidates: Set[str] = set()
        if total_time_spent > 0:
            unlock_candidates.add("FIRST_SESSION")
        if consecutive_days >= 3:
            unlock_candidates.add("STREAK_3")
        if consecutive_days >= 7:
            unlock_candidates.add("STREAK_7")
        if consecutive_days >= 30:
            unlock_candidates.add("STREAK_30")
        if total_time_spent >= 60:
            unlock_candidates.add("TOTAL_60")
        if total_time_spent >= 300:
            unlock_candidates.add("TOTAL_300")
        if total_time_spent >= 600:
            unlock_candidates.add("TOTAL_600")
        if total_time_spent >= 1_200:
            unlock_candidates.add("TOTAL_1200")
        if total_time_spent >= 3_000:
            unlock_candidates.add("TOTAL_3000")

        for code in unlock_candidates:
            if code in definition_codes:
                crud.ensure_user_achievement(
                    db,
                    user_id=user.id,
                    achievement_code=code,
                )

        user_achievements = crud.list_user_achievements(db, user_id=user.id)
        user_lookup = {
            record.achievement_code: record for record in user_achievements
        }

        achievement_statuses: List[schemas.AchievementStatus] = []
        for definition in achievement_defs:
            localized = _DEFAULT_ACHIEVEMENT_LOOKUP.get(definition.code)
            localized_name = localized.get("name") if localized else None
            localized_description = localized.get("description") if localized else None
            unlocked = user_lookup.get(definition.code)
            achievement_statuses.append(
                schemas.AchievementStatus(
                    code=definition.code,
                    name=localized_name or definition.name,
                    description=(
                        localized_description
                        if localized_description is not None
                        else definition.description
                    ),
                    category=definition.category,
                    achieved=unlocked is not None,
                    achieved_at=getattr(unlocked, "achieved_at", None)
                    if unlocked is not None
                    else None,
                )
            )

        current_level = schemas.LevelProgress(
            lexical=skill_levels["lexical"],
            syntactic=skill_levels["syntactic"],
            auditory=skill_levels["auditory"],
            overall_cefr_level=overall_skill_level,
            updated_at=getattr(user, "level_updated_at", None),
        )

        streak_summary = schemas.StudyStreakSummary(
            consecutive_days=consecutive_days,
            weekly_total_minutes=weekly_total_minutes,
            daily_minutes=daily_minutes,
        )

        return schemas.UserStatsResponse(
            streak=streak_summary,
            current_level=current_level,
            total_time_spent_minutes=total_time_spent,
            total_days=total_days,
            achievements=achievement_statuses,
        )

    def _load_achievement_definitions(self, db: Session) -> Sequence:
        if _DEFAULT_ACHIEVEMENTS:
            crud.ensure_achievements(db, definitions=_DEFAULT_ACHIEVEMENTS)
        # Return achievements in the order defined in _DEFAULT_ACHIEVEMENTS
        all_achievements = {a.code: a for a in crud.list_achievements(db)}
        return [all_achievements[item["code"]] for item in _DEFAULT_ACHIEVEMENTS if item["code"] in all_achievements]

    @staticmethod
    def _start_of_day(target: date) -> datetime:
        return datetime.combine(target, time.min, tzinfo=timezone.utc)

    @staticmethod
    def _calculate_streak(activity_dates: Sequence[date]) -> int:
        if not activity_dates:
            return 0

        activity_set = set(activity_dates)
        most_recent = max(activity_set)
        streak = 0

        current = most_recent
        while current in activity_set:
            streak += 1
            current = current - timedelta(days=1)
        return streak

    def _build_skill_levels(self, user: User) -> Dict[str, schemas.SkillLevel]:
        return {
            "lexical": self._build_skill_level(getattr(user, "lexical_level", None)),
            "syntactic": self._build_skill_level(getattr(user, "syntactic_level", None)),
            "auditory": self._build_skill_level(getattr(user, "speed_level", None)),
        }

    def _build_skill_level(self, score: object) -> schemas.SkillLevel:
        numeric = self._coerce_skill_score(score)
        cefr = get_cefr_level_from_score(numeric)
        try:
            cefr_level = CEFRLevel(cefr.value)
        except ValueError:
            cefr_level = CEFRLevel.A1
        return schemas.SkillLevel(
            cefr_level=cefr_level,
            score=numeric,
        )

    @staticmethod
    def _coerce_skill_score(value: object) -> float:
        if isinstance(value, Decimal):
            numeric = float(value)
        else:
            try:
                numeric = float(value)
            except (TypeError, ValueError):
                numeric = float(MIN_SCORE)
        return max(float(MIN_SCORE), min(float(MAX_SCORE), numeric))
