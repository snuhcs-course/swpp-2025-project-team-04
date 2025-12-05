from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace

from app.modules.stats import service as stats_service

try:
    from backend.app.modules.stats import service as backend_stats_service  # type: ignore
except Exception:  # pragma: no cover - fallback when alias missing
    backend_stats_service = None  # type: ignore


def _patch_crud(monkeypatch, attr: str, value):
    monkeypatch.setattr(stats_service.crud, attr, value)
    if backend_stats_service is not None:
        monkeypatch.setattr(backend_stats_service.crud, attr, value)


def _make_user(
    level: float = 90.0,
    *,
    syntactic_level: float | None = None,
    auditory_level: float | None = None,
):
    """Builds a mock user with optional overrides for each skill."""
    base_syntactic = syntactic_level if syntactic_level is not None else level
    base_auditory = auditory_level if auditory_level is not None else level
    return SimpleNamespace(
        id=1,
        lexical_level=Decimal(level),
        syntactic_level=Decimal(base_syntactic),
        speed_level=Decimal(base_auditory),
        level_updated_at=None,
    )


def test_stats_service_builds_full_payload(monkeypatch):
    svc = stats_service.StatsService()
    user = _make_user()

    today = date.today()
    activity_dates = [today - timedelta(days=offset) for offset in range(5)]

    _patch_crud(monkeypatch, "ensure_achievements", lambda *_, **__: None)
    _patch_crud(
        monkeypatch,
        "list_achievements",
        lambda *_: [
            SimpleNamespace(code="FIRST_SESSION", name="First", description="desc", category="milestone"),
            SimpleNamespace(code="TOTAL_3000", name="Hardworker", description="desc", category="time"),
        ],
    )
    _patch_crud(
        monkeypatch,
        "get_daily_study_minutes",
        lambda *_, **__: {today - timedelta(days=1): 60, today: 45},
    )
    _patch_crud(
        monkeypatch,
        "get_study_dates_descending",
        lambda *_, **__: activity_dates,
    )
    _patch_crud(monkeypatch, "get_total_study_minutes", lambda *_, **__: 3_600)
    _patch_crud(monkeypatch, "get_total_study_days", lambda *_, **__: 42)

    recorded_unlocks = []

    def fake_ensure_user_achievement(db, user_id, achievement_code):
        recorded_unlocks.append((user_id, achievement_code))
        return SimpleNamespace(achievement_code=achievement_code, achieved_at=today)

    _patch_crud(monkeypatch, "ensure_user_achievement", fake_ensure_user_achievement)
    _patch_crud(
        monkeypatch,
        "list_user_achievements",
        lambda *_, **__: [SimpleNamespace(achievement_code="FIRST_SESSION", achieved_at=today)],
    )

    payload = svc.get_user_stats(db="session", user=user)

    assert payload.total_time_spent_minutes == 3_600
    assert payload.total_days == 42
    assert payload.current_level.lexical.cefr_level.value == stats_service.get_cefr_level_from_score(90.0).value
    assert payload.current_level.overall_cefr_level is not None
    assert payload.current_level.overall_cefr_level.score == 90.0
    assert (
        payload.current_level.overall_cefr_level.cefr_level.value
        == stats_service.get_cefr_level_from_score(90.0).value
    )
    assert payload.streak.consecutive_days == 5
    assert recorded_unlocks  # achievements recorded
    assert any(a.code == "FIRST_SESSION" for a in payload.achievements)


def test_stats_service_calculates_overall_cefr_level(monkeypatch):
    svc = stats_service.StatsService()
    user = _make_user(level=200.0, syntactic_level=150.0, auditory_level=100.0)

    _patch_crud(monkeypatch, "ensure_achievements", lambda *_, **__: None)
    _patch_crud(monkeypatch, "list_achievements", lambda *_, **__: [])
    _patch_crud(monkeypatch, "get_daily_study_minutes", lambda *_, **__: {})
    _patch_crud(monkeypatch, "get_study_dates_descending", lambda *_, **__: [])
    _patch_crud(monkeypatch, "get_total_study_minutes", lambda *_, **__: 0)
    _patch_crud(monkeypatch, "get_total_study_days", lambda *_, **__: 0)
    _patch_crud(monkeypatch, "ensure_user_achievement", lambda *_, **__: None)
    _patch_crud(monkeypatch, "list_user_achievements", lambda *_, **__: [])

    payload = svc.get_user_stats(db="session", user=user)
    overall_level = payload.current_level.overall_cefr_level

    assert payload.total_days == 0
    assert overall_level is not None
    assert overall_level.score == 150.0  # average of the three scores above
    assert overall_level.cefr_level.value == stats_service.CEFRLevel.C1.value


def test_stats_service_helpers():
    svc = stats_service.StatsService()
    today = date.today()
    assert svc._calculate_streak([today, today - timedelta(days=1), today - timedelta(days=3)]) == 2
    assert svc._calculate_streak([]) == 0

    level = svc._build_skill_level(Decimal("15.5"))
    assert level.cefr_level.value in {"A1", "A2", "B1", "B2", "C1", "C2"}

    assert svc._coerce_skill_score("not-number") == stats_service.MIN_SCORE
