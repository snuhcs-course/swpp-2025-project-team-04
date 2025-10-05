from fastapi import FastAPI
from .modules.auth.endpoints import router as auth_router
from .modules.users.endpoints import router as users_router
from .core.config import engine, Base
from .core.exceptions import register_exception_handlers
app = FastAPI(title="LingoFit")

# 테이블 생성
Base.metadata.create_all(bind=engine)


register_exception_handlers(app)

app.include_router(auth_router, prefix = "/api/v1")
app.include_router(users_router, prefix = "/api/v1")

@app.get("/")
def read_root():
    return {"message": "Hello World"}