from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from ..core.logger import get_logger
from .utils import get_model
from .service import dialogue_stream_generator

router = APIRouter(prefix="/tts", tags=["TTS"])
logger = get_logger(__name__)


@router.post("/stream")
async def tts_stream_endpoint(request: Request, model=Depends(get_model)):
    """
    Stream TTS generation results line-by-line.
    """
    try:
        body = await request.json()
        sentences = body.get("sentences", [])
        silence_len = float(body.get("silence_len", 0.0))

        if not sentences:
            raise HTTPException(status_code=400, detail="No sentences provided.")

        logger.info(f"[TTS] Streaming request: {len(sentences)} sentences, silence={silence_len:.2f}s")

        return StreamingResponse(
            dialogue_stream_generator(model, sentences, silence_len),
            media_type="application/octet-stream",
        )

    except Exception as e:
        logger.exception("Error in /tts/stream endpoint")
        raise HTTPException(status_code=500, detail=str(e))
