from __future__ import annotations

from collections import deque
from types import SimpleNamespace

import pytest

from app.core import config


class DummyConnection:
    def __init__(self):
        self.commands = deque()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, statement, params=None):
        self.commands.append((statement, params))

        class _Result:
            def fetchone(self_inner):
                return ("RESTRICT",)

        return _Result()


class DummyEngine:
    def __init__(self, dialect_name="mysql"):
        self.dialect = SimpleNamespace(name=dialect_name)
        self.connection = DummyConnection()

    def begin(self):
        return self.connection


class DummyInspector:
    def __init__(self, missing_user_columns=None, missing_history_columns=None):
        self._missing_user = missing_user_columns or []
        self._missing_history = missing_history_columns or []

    def get_columns(self, table_name):
        base_columns = [
            {"name": "id"},
            {"name": "username"},
        ]
        if table_name == "users":
            return base_columns + [{"name": name} for name in ["lexical_level", "syntactic_level"] if name not in self._missing_user]
        if table_name == "user_level_history":
            return base_columns + [{"name": name} for name in ["llm_confidence"] if name not in self._missing_history]
        return base_columns

    def get_foreign_keys(self, table_name):
        return [
            {
                "name": f"fk_{table_name}_user",
                "referred_table": "users",
                "constrained_columns": ["user_id"],
            }
        ]


def test_apply_startup_migrations_noop(monkeypatch):
    engine = DummyEngine(dialect_name="sqlite")
    monkeypatch.setattr(config, "engine", engine)
    config.apply_startup_migrations()
    assert not engine.connection.commands


def test_apply_startup_migrations_mysql(monkeypatch):
    engine = DummyEngine()
    inspector = DummyInspector(missing_user_columns=["lexical_level"], missing_history_columns=["sample_count"])

    monkeypatch.setattr(config, "engine", engine)
    monkeypatch.setattr(config, "inspect", lambda conn: inspector)
    monkeypatch.setattr(config, "text", lambda stmt: stmt)  # simplify recorded command

    config.apply_startup_migrations()

    assert engine.connection.commands, "migration statements should be issued"
    assert any("ALTER TABLE" in command[0] for command in engine.connection.commands)


def test_apply_startup_migrations_fk_variations(monkeypatch):
    class RecordingConnection(DummyConnection):
        def __init__(self):
            super().__init__()
            self.delete_rules = {}
            self.fail_tables = set()

        def execute(self, statement, params=None):
            text_stmt = str(statement)
            if "SELECT DELETE_RULE" in text_stmt:
                table = params.get("table") if params else None
                rule = self.delete_rules.get(table)

                class _Result:
                    def __init__(self, value):
                        self.value = value

                    def fetchone(self_inner):
                        return (self_inner.value,)

                return _Result(rule)
            for table in self.fail_tables:
                if table in text_stmt and "DROP FOREIGN KEY" in text_stmt:
                    raise RuntimeError("drop failed")
            return super().execute(statement, params)

    class RecordingInspector(DummyInspector):
        def __init__(self):
            super().__init__(
                missing_user_columns=[
                    "lexical_level",
                    "syntactic_level",
                    "speed_level",
                    "initial_level_completed",
                    "level_score",
                    "llm_confidence",
                ],
                missing_history_columns=[
                    "level_score",
                    "llm_confidence",
                    "average_understanding",
                    "sample_count",
                ],
            )
            self.fks = {
                "generated_contents": [
                    {"name": "fk_gc", "constrained_columns": ["user_id"], "referred_table": "users"}
                ],
                "vocab_entries": [
                    {"name": "fk_vocab", "constrained_columns": ["user_id"], "referred_table": "users"}
                ],
                "user_level_history": [
                    {"name": "fk_history", "constrained_columns": ["user_id"], "referred_table": "users"}
                ],
                "user_achievements": [
                    {"name": "fk_ach", "constrained_columns": ["user_id"], "referred_table": "users"}
                ],
            }

        def get_foreign_keys(self, table_name):
            if table_name == "study_sessions":
                raise RuntimeError("missing table")
            return self.fks.get(table_name, [])

    engine = DummyEngine()
    connection = RecordingConnection()
    connection.delete_rules = {
        "generated_contents": "CASCADE",
        "vocab_entries": "RESTRICT",
        "user_achievements": "RESTRICT",
    }
    connection.fail_tables = {"user_achievements"}
    engine.connection = connection

    inspector = RecordingInspector()

    monkeypatch.setattr(config, "engine", engine)
    monkeypatch.setattr(config, "inspect", lambda conn: inspector)
    monkeypatch.setattr(config, "text", lambda stmt: stmt)

    config.apply_startup_migrations()

    # All relevant ALTER statements should have been attempted.
    executed = "\n".join(cmd if isinstance(cmd, str) else cmd[0] for cmd in connection.commands)
    assert "ADD COLUMN syntactic_level" in executed
    assert "ADD COLUMN llm_confidence" in executed
    assert "DROP FOREIGN KEY" in executed


def test_get_db_closes_session(monkeypatch):
    class DummySession:
        def __init__(self):
            self.closed = False

        def close(self):
            self.closed = True

    dummy_session = DummySession()
    monkeypatch.setattr(config, "SessionLocal", lambda: dummy_session)

    generator = config.get_db()
    session = next(generator)
    assert session is dummy_session
    with pytest.raises(StopIteration):
        next(generator)
    assert dummy_session.closed
