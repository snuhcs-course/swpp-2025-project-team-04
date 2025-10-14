
import io
import json
import base64
import numpy as np
import soundfile as sf
from fastapi import  Request, HTTPException
from ..core import config
from ..core.logger import get_logger

logger = get_logger(__name__)


def get_model(request: Request):
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded yet")
    return model


def pcm_to_wav_bytes(pcm: np.ndarray, samplerate: int = config.SAMPLE_RATE) -> bytes:
    buffer = io.BytesIO()
    sf.write(buffer, pcm, samplerate, format="WAV")
    buffer.seek(0)
    return buffer.read()

