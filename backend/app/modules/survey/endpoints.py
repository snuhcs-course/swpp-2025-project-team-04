from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter(prefix="/initial-survey", tags=["survey"])

BASE_DIR = Path(__file__).resolve().parent
TESTSETS_DIR = BASE_DIR / "testsets"

@router.get("/{level}/{number}")
def get_initial_survey_audio(level: str, number: int):
    """ initial survey를 위한 정적 wav 파일 제공
        TODO: testset wav 파일들을 S3에 서빙
    """
    
    filename = f"level_{level}_{number}.wav"
    file_path = TESTSETS_DIR / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(path=str(file_path), media_type="audio/wav", filename=filename)
