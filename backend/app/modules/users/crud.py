from sqlalchemy.orm import Session

from app.core.exceptions import UserNotFoundException
from app.modules.personalization.models import CEFRLevel
from .models import User

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
    commit: bool = True,
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise UserNotFoundException()

    user.level = level
    db.add(user)

    if commit:
        db.commit()
        db.refresh(user)

    return user