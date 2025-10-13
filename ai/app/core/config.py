from pathlib import Path

APP_NAME = "VoxCPM TTS API"
HOST = "0.0.0.0"
PORT = 3004

MODEL_NAME = "openbmb/VoxCPM-0.5B"
SAMPLE_RATE = 16000
INFERENCE_TIMESTAMP = 13

# directory config
BASE_DIR = Path(__file__).resolve().parent.parent
