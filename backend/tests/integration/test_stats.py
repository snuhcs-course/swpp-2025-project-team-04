from datetime import datetime, timezone
from types import SimpleNamespace

from backend.app.modules.stats import crud
from backend.app.modules.stats.service import StatsService, _DEFAULT_ACHIEVEMENTS
from backend.app.modules.level_management.models import CEFRLevel
from backend.app.modules.stats.models import StudySession
from backend.app.modules.users.models import User as AppUser, CEFRLevel as UserCEFRLevel
from backend.app.core.config import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def test_get_user_stats_aggregates_data(monkeypatch):
    from backend.app.modules.stats import service as service_module

    real_datetime = datetime

    class FixedDateTime(real_datetime):
        @classmethod
        def now(cls, tz=None):
            base = real_datetime(2024, 5, 7, 9, 0, tzinfo=timezone.utc)
            if tz is None:
                return base.replace(tzinfo=None)
            return base.astimezone(tz)

    monkeypatch.setattr(service_module, "datetime", FixedDateTime)

    db = SimpleNamespace()
    user = SimpleNamespace(
        id=21,
        level=CEFRLevel.B2,
        level_score=82,
        llm_confidence=78,
        level_updated_at=real_datetime(2024, 5, 2, tzinfo=timezone.utc),
        lexical_level=80,
        syntactic_level=35,
        speed_level=10,
    )

    daily_minutes = {
        real_datetime(2024, 5, 5, tzinfo=timezone.utc).date(): 45,
        real_datetime(2024, 5, 6, tzinfo=timezone.utc).date(): 30,
        real_datetime(2024, 5, 7, tzinfo=timezone.utc).date(): 60,
    }

    def fake_get_daily_study_minutes(
        db_arg,
        *,
        user_id,
        start_at,
        end_at,
    ):
        assert db_arg is db
        assert user_id == user.id
        assert start_at.tzinfo is timezone.utc
        assert end_at.tzinfo is timezone.utc
        return daily_minutes

    def fake_get_study_dates_descending(db_arg, *, user_id, limit):
        assert db_arg is db
        assert user_id == user.id
        assert limit == 60
        return [
            real_datetime(2024, 5, 7).date(),
            real_datetime(2024, 5, 6).date(),
            real_datetime(2024, 5, 5).date(),
        ]

    def fake_get_total_study_minutes(db_arg, *, user_id):
        assert db_arg is db
        assert user_id == user.id
        return 600

    def fake_get_total_study_days(db_arg, *, user_id):
        assert db_arg is db
        assert user_id == user.id
        return 42

    ensured = []

    def fake_ensure_achievements(db_arg, *, definitions):
        assert db_arg is db
        ensured.append(tuple(defn["code"] for defn in definitions))

    achievements = [
        SimpleNamespace(
            code=item["code"],
            name=item["name"],
            description=item.get("description"),
            category=item.get("category"),
        )
        for item in _DEFAULT_ACHIEVEMENTS
    ]

    def fake_list_achievements(db_arg):
        assert db_arg is db
        return achievements

    awarded = {
        "FIRST_SESSION": real_datetime(2024, 5, 1, tzinfo=timezone.utc),
    }

    def fake_ensure_user_achievement(db_arg, *, user_id, achievement_code):
        assert db_arg is db
        assert user_id == user.id
        awarded.setdefault(achievement_code, real_datetime(2024, 5, 7, tzinfo=timezone.utc))
        return SimpleNamespace(
            achievement_code=achievement_code,
            achieved_at=awarded[achievement_code],
        )

    def fake_list_user_achievements(db_arg, *, user_id):
        assert db_arg is db
        assert user_id == user.id
        return [
            SimpleNamespace(
                achievement_code=code,
                achieved_at=achieved_at,
            )
            for code, achieved_at in awarded.items()
        ]

    crud_modules = [crud, service_module.crud]
    try:
        from app.modules.stats import crud as app_crud  # type: ignore

        crud_modules.append(app_crud)
    except Exception:
        pass

    for module in {id(mod): mod for mod in crud_modules}.values():
        monkeypatch.setattr(module, "get_daily_study_minutes", fake_get_daily_study_minutes)
        monkeypatch.setattr(module, "get_study_dates_descending", fake_get_study_dates_descending)
        monkeypatch.setattr(module, "get_total_study_minutes", fake_get_total_study_minutes)
        monkeypatch.setattr(module, "get_total_study_days", fake_get_total_study_days)
        monkeypatch.setattr(module, "ensure_achievements", fake_ensure_achievements)
        monkeypatch.setattr(module, "list_achievements", fake_list_achievements)
        monkeypatch.setattr(module, "ensure_user_achievement", fake_ensure_user_achievement)
        monkeypatch.setattr(module, "list_user_achievements", fake_list_user_achievements)

    service = StatsService()
    stats = service.get_user_stats(db=db, user=user)

    if _DEFAULT_ACHIEVEMENTS:
        assert ensured
    assert set(awarded.keys()) == {
        "FIRST_SESSION",
        "STREAK_3",
        "TOTAL_60",
        "TOTAL_300",
        "TOTAL_600",
    }
    assert stats.total_time_spent_minutes == 600
    assert stats.current_level.lexical.cefr_level == CEFRLevel.B1
    assert stats.current_level.lexical.score == 80
    assert stats.current_level.syntactic.cefr_level == CEFRLevel.A2
    assert stats.current_level.auditory.cefr_level == CEFRLevel.A1

    assert stats.streak.weekly_total_minutes == 135
    assert stats.streak.consecutive_days == 3
    assert len(stats.streak.daily_minutes) == 7
    assert stats.streak.daily_minutes[-1].minutes == 60
    assert stats.total_days == 42

    achieved = {item.code: item.achieved for item in stats.achievements}
    assert achieved["FIRST_SESSION"] is True
    assert achieved["STREAK_3"] is True
    assert achieved["TOTAL_60"] is True
    assert achieved["TOTAL_300"] is True
    assert achieved["TOTAL_600"] is True
    assert achieved["TOTAL_1200"] is False
    assert achieved["STREAK_30"] is False

    first_achievement = next(item for item in stats.achievements if item.code == "FIRST_SESSION")
    assert first_achievement.achieved_at is not None


def test_get_user_stats_handles_no_activity(monkeypatch):
    db = SimpleNamespace()
    user = SimpleNamespace(
        id=99,
        level=CEFRLevel.A1,
        level_score=None,
        llm_confidence=None,
        level_updated_at=None,
    )

    monkeypatch.setattr(crud, "ensure_achievements", lambda *args, **kwargs: None)
    monkeypatch.setattr(crud, "list_achievements", lambda *args, **kwargs: [
        SimpleNamespace(code="FIRST_SESSION", name="첫 학습 달성", description=None, category="milestone")
    ])
    monkeypatch.setattr(crud, "get_daily_study_minutes", lambda *args, **kwargs: {})
    monkeypatch.setattr(crud, "get_study_dates_descending", lambda *args, **kwargs: [])
    monkeypatch.setattr(crud, "get_total_study_minutes", lambda *args, **kwargs: 0)
    monkeypatch.setattr(crud, "get_total_study_days", lambda *args, **kwargs: 0)
    monkeypatch.setattr(crud, "ensure_user_achievement", lambda *args, **kwargs: SimpleNamespace(
        achievement_code="FIRST_SESSION",
        achieved_at=None,
    ))
    monkeypatch.setattr(crud, "list_user_achievements", lambda *args, **kwargs: [])

    service = StatsService()
    stats = service.get_user_stats(db=db, user=user)

    assert stats.total_time_spent_minutes == 0
    assert stats.total_days == 0
    assert stats.streak.consecutive_days == 0
    assert all(item.minutes == 0 for item in stats.streak.daily_minutes)
    assert stats.achievements[0].achieved is False


def test_calculate_streak_returns_zero_for_empty_list():
    service = StatsService()
    assert service._calculate_streak([]) == 0


def test_stats_crud_functions_with_sqlite():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        user = AppUser(
            username="stats-user",
            hashed_password="hashed",
            nickname="Statsy",
            level=UserCEFRLevel.A1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        db.add_all(
            [
                StudySession(
                    user_id=user.id,
                    started_at=datetime(2024, 5, 5, 10, 0),
                    duration_minutes=30,
                    activity_type="session",
                ),
                StudySession(
                    user_id=user.id,
                    started_at=datetime(2024, 5, 6, 9, 0),
                    duration_minutes=45,
                    activity_type="session",
                ),
            ]
        )
        db.commit()

        # ensure_achievements는 MySQL 전용 구문 사용으로 SQLite 테스트에서 제외
        # achievements 관련 테스트 스킵

        window_start = datetime(2024, 5, 1, tzinfo=timezone.utc)
        window_end = datetime(2024, 5, 10, tzinfo=timezone.utc)
        daily = crud.get_daily_study_minutes(
            db,
            user_id=user.id,
            start_at=window_start,
            end_at=window_end,
        )
        normalized_daily = {str(key): value for key, value in daily.items()}
        assert normalized_daily["2024-05-05"] == 30
        assert normalized_daily["2024-05-06"] == 45

        total = crud.get_total_study_minutes(db, user_id=user.id)
        assert total == 75

        dates = crud.get_study_dates_descending(db, user_id=user.id, limit=5)
        normalized_dates = [str(item) for item in dates]
        assert normalized_dates[0] == "2024-05-06"
        assert normalized_dates[1] == "2024-05-05"

        # ensure_user_achievement, list_achievements, list_user_achievements 테스트 스킵
        # (MySQL 전용 ensure_achievements 없이 실행 불가)
    finally:
        db.close()
