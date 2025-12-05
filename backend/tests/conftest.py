from __future__ import annotations

import os
import sys
import types
from importlib import import_module, util as importlib_util
from pathlib import Path
from typing import Iterator

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BASE_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.config import Base


def _ensure_level_management_models_loaded():
    package_name = "app.modules.level_management"
    models_name = f"{package_name}.models"
    if models_name in sys.modules:
        return

    package = types.ModuleType(package_name)
    package.__path__ = [str((BASE_DIR / "app/modules/level_management").resolve())]
    sys.modules[package_name] = package

    spec = importlib_util.spec_from_file_location(
        models_name,
        (BASE_DIR / "app/modules/level_management/models.py").resolve(),
    )
    module = importlib_util.module_from_spec(spec)
    sys.modules[models_name] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))


@pytest.fixture()
def sqlite_session() -> Iterator[Session]:
    """Provide a throwaway in-memory SQLite session for unit tests."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    _ensure_level_management_models_loaded()
    # Import models so metadata is populated without touching level-management router.
    import_module("app.modules.audio.model")
    import_module("app.modules.stats.models")
    import_module("app.modules.users.crud")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session: Session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
