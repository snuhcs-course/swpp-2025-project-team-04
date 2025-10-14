import httpx
import os
from fastapi import APIRouter, Response
from .schemas import ElevenLabsPayload
from fastapi.responses import StreamingResponse

# This will now be loaded correctly by the logic in main.py
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

router = APIRouter()

@router.post("/v1/audio/generate-dialogue-stream", tags=["Audio Generation"])
async def generate_dialogue_stream(payload: ElevenLabsPayload):
    elevenlabs_url = "https://api.elevenlabs.io/v1/text-to-dialogue/stream"
    
    headers = { 
        "Content-Type": "application/json", 
        "xi-api-key": ELEVENLABS_API_KEY 
    }
    
    data_to_send = payload.model_dump()

    async with httpx.AsyncClient() as client:
        try:
            response_stream = await client.post(elevenlabs_url, headers=headers, json=data_to_send, timeout=60)
            response_stream.raise_for_status()
            return StreamingResponse(response_stream.aiter_bytes(), media_type="audio/mpeg")
        except httpx.HTTPStatusError as e:
            error_content = e.response.content
            return Response(content=error_content, status_code=e.response.status_code)