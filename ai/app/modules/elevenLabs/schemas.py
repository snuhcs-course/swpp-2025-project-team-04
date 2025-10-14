from pydantic import BaseModel
from typing import List

class DialogueItem(BaseModel):
    text: str
    voice_id: str

class ElevenLabsPayload(BaseModel):
    inputs: List[DialogueItem]