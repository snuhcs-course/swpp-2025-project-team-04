from fastapi import FastAPI
from .core.model_loader import load_voxcpm_model
from .core import config

app = FastAPI(title=config.APP_NAME)

@app.on_event("startup")
async def startup_event():
    app.state.model = load_voxcpm_model()


@app.get("/")
async def root():
    return {"status": "ok", "app_name": config.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.app.main:app", host=config.HOST, port=config.PORT, reload=True)
