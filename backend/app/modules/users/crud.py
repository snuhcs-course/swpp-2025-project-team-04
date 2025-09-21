from sqlalchemy.orm import Session
from .models import User

def create_user(db: Session, username: str, hashed_password: str):
    user = User(username=username, hashed_password=hashed_password)
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