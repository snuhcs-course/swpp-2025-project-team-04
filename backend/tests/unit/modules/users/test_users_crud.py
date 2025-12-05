from __future__ import annotations

import pytest

from app.modules.users import crud
from app.core.exceptions import UserNotFoundException
from app.modules.users.models import CEFRLevel
from app.modules.users.interests import InterestKey


def test_user_crud_flow(sqlite_session):
    created = crud.create_user(sqlite_session, username="demo", hashed_password="pw", nickname="Demo")
    assert created.id is not None

    fetched = crud.get_user_by_username(sqlite_session, "demo")
    assert fetched.id == created.id

    updated = crud.update_user_level(
        sqlite_session,
        user_id=created.id,
        level=CEFRLevel.B2,
        level_score=70,
        llm_confidence=80,
        initial_level_completed=True,
    )
    assert updated.level == CEFRLevel.B2
    assert updated.initial_level_completed is True

    crud.update_user_password(sqlite_session, updated, "new-pw")
    assert updated.hashed_password == "new-pw"

    assert crud.delete_user(sqlite_session, "demo") is True
    assert crud.get_user_by_username(sqlite_session, "demo") is None


def test_update_user_level_missing_user(sqlite_session):
    with pytest.raises(UserNotFoundException):
        crud.update_user_level(sqlite_session, user_id=999, level=CEFRLevel.A1)


def test_create_user_defaults_and_delete_missing(sqlite_session):
    user = crud.create_user(sqlite_session, username="nick", hashed_password="pw")
    assert user.nickname == "nick"
    assert crud.delete_user(sqlite_session, "unknown") is False
    assert crud.get_user_by_username(sqlite_session, "ghost") is None


def test_update_user_level_without_commit(sqlite_session):
    user = crud.create_user(sqlite_session, username="commitless", hashed_password="pw")
    updated = crud.update_user_level(
        sqlite_session,
        user_id=user.id,
        level=CEFRLevel.B1,
        level_score=10,
        llm_confidence=20,
        initial_level_completed=False,
        commit=False,
    )
    assert updated.level == CEFRLevel.B1
    assert updated.level_score == 10
    assert updated.llm_confidence == 20
    assert updated.initial_level_completed is False


def test_set_user_interests_flow(sqlite_session):
    user = crud.create_user(sqlite_session, username="interest", hashed_password="pw")

    updated = crud.set_user_interests(
        sqlite_session,
        user_id=user.id,
        interest_keys=[InterestKey.POLITICS, InterestKey.SCIENCE],
    )
    assert set(interest.key for interest in updated.interests) == {
        InterestKey.POLITICS,
        InterestKey.SCIENCE,
    }

    updated = crud.set_user_interests(
        sqlite_session,
        user_id=user.id,
        interest_keys=[InterestKey.SCIENCE, InterestKey.SCIENCE, InterestKey.IT_AI],
    )
    assert set(interest.key for interest in updated.interests) == {
        InterestKey.SCIENCE,
        InterestKey.IT_AI,
    }

    updated = crud.set_user_interests(
        sqlite_session,
        user_id=user.id,
        interest_keys=[]
    )
    assert updated.interests == []

def test_set_user_interests_missing_user(sqlite_session):
    with pytest.raises(UserNotFoundException):
        crud.set_user_interests(sqlite_session, user_id=999, interest_keys=[InterestKey.MUSIC])
