import httpx
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

AUDIO_SERVICE_URL = "http://127.0.0.1:8000/v1/audio/generate-dialogue-stream"

app = FastAPI(title="Temporary Main Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/get-story-audio", tags=["Testing"])
async def get_story_audio():
    script_payload = {
        "inputs": [
            { "text": "Testing the new nested structure.", "voice_id": "21m00Tcm4TlvDq8ikWAM" },
            { "text": "It works!", "voice_id": "2EiwWnXFnvU5JabPnv8n" }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(AUDIO_SERVICE_URL, json=script_payload, timeout=60)
            response.raise_for_status()
            return StreamingResponse(response.aiter_bytes(), media_type=response.headers.get("content-type"))
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Audio service is unavailable.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error from audio service: {e.response.text}")