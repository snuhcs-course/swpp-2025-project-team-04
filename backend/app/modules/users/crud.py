from typing import Sequence

from sqlalchemy.orm import Session

from ...core.exceptions import UserNotFoundException
from ..level_management.models import CEFRLevel
from .interests import InterestKey
from .models import User, UserInterest

def create_user(db: Session, username: str, hashed_password: str, nickname: str = None):
    if nickname is None:
        nickname = username
    user = User(username=username, hashed_password=hashed_password, nickname=nickname)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def delete_user(db: Session, username: str):
    user = db.query(User).filter(User.username == username).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def update_user_level(
    db: Session,
    *,
    user_id: int,
    level: CEFRLevel,
    level_score: int | None = None,
    llm_confidence: int | None = None,
    initial_level_completed: bool | None = None,
    commit: bool = True,
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise UserNotFoundException()

    user.level = level
    if level_score is not None:
        user.level_score = level_score
    if llm_confidence is not None:
        user.llm_confidence = llm_confidence
    if initial_level_completed is not None:
        user.initial_level_completed = initial_level_completed
    db.add(user)

    if commit:
        db.commit()
        db.refresh(user)

    return user


def update_user_password(db: Session, user: User, hashed_password: str) -> User:
    """
    Persist a password change for the given user.
    """
    user.hashed_password = hashed_password
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def set_user_interests(
    db: Session,
    *,
    user_id: int,
    interest_keys: Sequence[InterestKey],
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise UserNotFoundException()

    unique_keys = list(dict.fromkeys(interest_keys))
    db.query(UserInterest).filter(UserInterest.user_id == user_id).delete(synchronize_session=False)

    for key in unique_keys:
        db.add(UserInterest(user_id=user_id, interest_key=key))

    db.commit()
    db.refresh(user)
    return user
