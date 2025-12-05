from pydantic import BaseModel
from typing import Any, Optional


class AddVocabRequest(BaseModel):
    word: str


class VocabEntryResponse(BaseModel):
    id: int
    word: str
    example_sentence: Optional[str]
    example_sentence_url: Optional[str]
    pos: Optional[str]
    meaning: Optional[str]

    class Config:
        orm_mode = True
