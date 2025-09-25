from fastapi import FastAPI
from .modules.auth.endpoints import router as auth_router
from .modules.users.endpoints import router as users_router
from .core.config import engine, Base

app = FastAPI(title="LingoFit")

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on application startup"""
    Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix = "/api/v1")
app.include_router(users_router, prefix = "/api/v1")

@app.get("/")
def read_root():
    return {"message": "Hello World"}