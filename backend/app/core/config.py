from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

class Settings(BaseSettings):
    app_name: str = "LingoFit"
    debug: bool = False
    db_user: str
    db_password: str
    db_host: str
    db_name: str
    secret_key: str

    class Config:
        env_file = "backend/.env"


settings = Settings()

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}/{settings.db_name}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # auto connection
    pool_recycle=1800,    
    pool_size=10,        
    max_overflow=20    
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()