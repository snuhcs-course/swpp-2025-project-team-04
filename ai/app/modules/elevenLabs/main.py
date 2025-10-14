from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

# --- Configuration Loading ---
project_root = Path(__file__).resolve().parent.parent.parent.parent
env_path = project_root / ".env"
if env_path.is_file():
    load_dotenv(dotenv_path=env_path)
# -----------------------------

# Import endpoints AFTER loading the environment
from .endpoints import router as audio_router

app = FastAPI(title="ElevenLabs Audio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio_router)