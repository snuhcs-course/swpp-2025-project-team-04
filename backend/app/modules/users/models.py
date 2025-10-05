from sqlalchemy import Column, Integer, String
from ...core.config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    nickname = Column(String(50), unique=False, index=False, nullable=False)
    # 추후 프로필 관련 필드 추가