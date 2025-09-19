from fastapi import FastAPI

from .modules.users.endpoints import router as users_router


app = FastAPI(title="LingoFit")

app.include_router(users_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Hello World"}