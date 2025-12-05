from fastapi import FastAPI
from .core.model_loader import load_voxcpm_model
from .core import config
from .core.logger import get_logger

app = FastAPI(title=config.APP_NAME)
logger = get_logger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Loading model: {config.MODEL_NAME}")
    app.state.model = load_voxcpm_model()
    logger.info("Model loaded successfully.")


@app.get("/")
async def root():
    logger.info("Health check called.")
    return {"status": "ok", "app_name": config.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.app.main:app", host=config.HOST, port=config.PORT, reload=True)
