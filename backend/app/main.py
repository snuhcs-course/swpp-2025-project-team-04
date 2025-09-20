from fastapi import FastAPI
from .modules.auth.endpoints import router as auth_router
from .modules.users.models import Base
from .core.config import engine
from sqlalchemy.ext.declarative import declarative_base

app = FastAPI(title="LingoFit")

Base = declarative_base()

# 테이블 생성
Base.metadata.create_all(bind=engine)

app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Hello World"}