from fastapi import FastAPI

from .modules.auth.endpoints import router as auth_router


app = FastAPI(title="LingoFit")

app.include_router(auth_router)


@app.get("/")
def read_root():
    return {"message": "Hello World"}