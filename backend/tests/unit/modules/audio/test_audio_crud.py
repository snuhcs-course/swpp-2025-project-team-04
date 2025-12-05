from __future__ import annotations

from app.modules.audio import crud
from app.modules.users import crud as user_crud


def _create_user(session):
    return user_crud.create_user(session, username="audio-user", hashed_password="pw")


def test_insert_and_list_generated_content(sqlite_session):
    user = _create_user(sqlite_session)

    record = crud.insert_generated_content(
        sqlite_session,
        user_id=user.id,
        title="Sample",
        script_data="script",
    )
    assert record.generated_content_id is not None

    items = crud.get_generated_contents_by_user(sqlite_session, user_id=user.id, limit=10)
    assert len(items) == 1 and items[0].title == "Sample"
    assert crud.count_generated_contents_by_user(sqlite_session, user_id=user.id) == 1


def test_update_and_fetch_generated_content(sqlite_session):
    user = _create_user(sqlite_session)
    record = crud.insert_generated_content(
        sqlite_session,
        user_id=user.id,
        title="Before",
        script_data=None,
    )

    updated = crud.update_generated_content_vocabs(
        sqlite_session,
        content_id=record.generated_content_id,
        script_vocabs={"words": []},
    )
    assert updated.script_vocabs == {"words": []}

    updated_audio = crud.update_generated_content_audio(
        sqlite_session,
        content_id=record.generated_content_id,
        audio_url="https://audio",
        response_json={"status": "done"},
    )
    assert updated_audio.audio_url == "https://audio"

    fetched = crud.get_generated_content_by_id(
        sqlite_session,
        content_id=record.generated_content_id,
    )
    assert fetched.response_json["status"] == "done"


def test_get_generated_content_by_id_missing(sqlite_session):
    assert crud.get_generated_content_by_id(sqlite_session, content_id=9999) is None
