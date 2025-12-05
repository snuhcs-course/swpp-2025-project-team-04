# app/modules/audio/endpoints.py

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, RedirectResponse
import boto3
from ...core.config import settings
import os
import json
from sqlalchemy.orm import Session
from . import schemas
from . import service as AudioService
from ..users.models import User
from ..users.endpoints import get_current_user
from ..users.crud import get_user_by_username
from ...core.auth import verify_token, TokenType
from ...core.config import get_db
from ...core.logger import logger
import asyncio

router = APIRouter()

async def get_user_from_token(token: str) -> User | None:
    """
    제공된 토큰을 기반으로 사용자를 조회합니다.
    get_current_user와 동일한 로직을 사용하되 WebSocket 컨텍스트에 맞게 조정
    """
    try:
        # JWT 토큰 검증 (get_current_user와 동일한 로직)
        token_data = verify_token(token, TokenType.ACCESS_TOKEN)
        username = token_data["username"]
        
        # 데이터베이스 세션 생성 (WebSocket에서는 Depends를 사용할 수 없음)
        db = next(get_db())
        try:
            user = get_user_by_username(db, username)
            return user
        finally:
            db.close()
            
    except Exception as e:
        logger.warning(f"토큰 인증 실패: {str(e)}")
        return None


@router.post(
    "/test-generate",
    response_model=schemas.FinalAudioResponse 
)
async def test_generate_audio(
    request: schemas.AudioGenerateRequest
):
    """
    Test endpoint without authentication - generates full audio pipeline with dummy user
    """
    # Create dummy user for testing
    from ..users.models import CEFRLevel
    dummy_user = User(
        id=1,
        username="testuser", 
        hashed_password="dummy",
        nickname="Test User",
        level=CEFRLevel.B1
    )
    
    try:
        # Run the complete pipeline: Script generation + Voice selection + Audio generation + Timestamp parsing
        result = await AudioService.AudioService.generate_full_audio_with_timestamps(
            request=request,
            user=dummy_user
        )
        
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@router.post(
    "/generate",
    response_model=schemas.FinalAudioResponse
)
async def generate_audio(
    request: schemas.AudioGenerateRequest,
    current_user: User = Depends(get_current_user) # <-- Use real dependency
):
    """
    Generates a 3-5 minute audio script based on mood, theme,
    and user level, selects a challenging voice, and creates audio with timestamps.
    """
    try:
        # Complete pipeline: Script generation + Voice selection + Audio generation + Timestamp parsing
        result = await AudioService.AudioService.generate_full_audio_with_timestamps(
            request=request,
            user=current_user
        )
        
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.post(
    "/generate-mock",
    response_model=schemas.FinalAudioResponse,
)
async def generate_mock_audio(
    request: schemas.AudioGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Mock endpoint: /generate 와 동일한 요청/응답 스키마를 가지지만
    실제 생성 대신 고정된 예시 응답을 2초 지연 후 반환합니다.
    """
    # 인풋은 검증만 하고 사용하지 않음
    await asyncio.sleep(2)

    return {
        "generated_content_id": 292,
        "title": "Easy Tips to Save Your Money",
        "audio_url": "https://swpp-audio-bucket.s3.ap-northeast-2.amazonaws.com/audio/8d562e0f-13a9-4874-805b-0d4429060810.mp3",
        "sentences": [
            {"id": 0, "start_time": 0, "text": "Hello there, my friend."},
            {"id": 1, "start_time": 1.695, "text": "I want to tell you about money."},
            {"id": 2, "start_time": 4.226, "text": "Money helps us buy food, clothes, and toys."},
            {"id": 3, "start_time": 7.814, "text": "It is important to use money wisely."},
            {"id": 4, "start_time": 11.192, "text": "First, try to save a little money each week."},
            {"id": 5, "start_time": 14.547, "text": "You can put coins in a jar or a small box."},
            {"id": 6, "start_time": 18.042, "text": "When the jar is full, you have saved a nice amount."},
            {"id": 7, "start_time": 22.964, "text": "Next, think before you buy something."},
            {"id": 8, "start_time": 25.809, "text": "Ask yourself, \"Do I really need this?\""},
            {"id": 9, "start_time": 29.396, "text": "If the answer is no, it’s better to wait."},
            {"id": 10, "start_time": 33.146, "text": "Waiting helps you not spend too much money."},
            {"id": 11, "start_time": 35.747, "text": "Also, it is good to make a simple plan."},
            {"id": 12, "start_time": 38.289, "text": "Write down what you earn and what you spend."},
            {"id": 13, "start_time": 40.565, "text": "This way, you know where your money goes."},
            {"id": 14, "start_time": 42.829, "text": "Remember, saving is like planting seeds."},
            {"id": 15, "start_time": 45.58, "text": "Small savings grow bigger over time."},
            {"id": 16, "start_time": 47.577, "text": "Soon you will have money for something special."},
            {"id": 17, "start_time": 50.584, "text": "Money can feel tricky, but it’s easy if you try."},
            {"id": 18, "start_time": 53.011, "text": "Save a little, buy less, and plan well."},
            {"id": 19, "start_time": 55.844, "text": "You will feel happy and safe with your money."},
            {"id": 20, "start_time": 59.211, "text": "That’s all for now, my friend."},
            {"id": 21, "start_time": 61.405, "text": "Take care and good luck with your money journey!"},
        ],
    }


@router.get(
    "/history",
    response_model=schemas.AudioHistoryListResponse,
)
def list_audio_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the authenticated user's previously generated audio files (paginated).
    """
    safe_limit = max(1, min(limit, 50))
    safe_offset = max(0, offset)
    items = AudioService.AudioService.list_user_audio_history(
        db,
        user_id=current_user.id,
        limit=safe_limit,
        offset=safe_offset,
    )
    total = AudioService.AudioService.count_user_audio_history(
        db,
        user_id=current_user.id,
    )
    return {
        "items": items,
        "total": total,
        "limit": safe_limit,
        "offset": safe_offset,
    }

@router.get(
    "/content/{generated_content_id}",
    response_model=schemas.FinalAudioResponse,
)
def get_audio_content_by_id(
    generated_content_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve the response_json field for a given generated_content_id.
    Returns the full response payload including audio_url and sentences.
    """
    from . import crud
    
    content = crud.get_generated_content_by_id(db, content_id=generated_content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    
    # Return the response_json field directly
    if not content.response_json:
        raise HTTPException(status_code=404, detail="Response data not available")
    
    return content.response_json

@router.get("/files/{filename}")
async def get_audio_file(filename: str):
    """
    Serve audio files from temporary storage
    """
    # Get the temp audio directory path
    from .service import TEMP_AUDIO_DIR
    
    file_path = os.path.join(TEMP_AUDIO_DIR, filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Return the file
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=filename
    )

@router.websocket("/ws/generate")
async def websocket_generate_audio(websocket: WebSocket):
    """
    WebSocket을 통해 오디오 생성을 스트리밍합니다.
    
    프로토콜:
    1. 클라이언트 연결
    2. 클라이언트 -> 서버: {"type": "auth", "payload": {"token": "..."}}
    3. 서버 -> 클라이언트: {"type": "auth_success"} 또는 {"type": "error"}
    4. 클라이언트 -> 서버: {"type": "generate_audio", "payload": {"style": "...", "theme": "..."}}
    5. 서버 -> 클라이언트: (반복) {"type": "status_update", "payload": {...}}
    6. 서버 -> 클라이언트: {"type": "generation_complete", "payload": {...}}
    7. 연결 종료
    """
    await websocket.accept()
    logger.info("WebSocket 클라이언트 연결됨.")
    
    current_user: User | None = None
    
    try:
        # 클라이언트로부터 첫 번째 메시지(인증)를 기다립니다.
        auth_message_raw = await websocket.receive_text()
        auth_data = json.loads(auth_message_raw)
        
        if auth_data.get("type") != "auth":
            await websocket.send_json({"type": "error", "payload": {"message": "인증이 필요합니다."}})
            await websocket.close(code=1008) # Policy Violation
            return

        token = auth_data.get("payload", {}).get("token")
        if not token:
            await websocket.send_json({"type": "error", "payload": {"message": "토큰이 제공되지 않았습니다."}})
            await websocket.close(code=1008)
            return

        # 가상 인증 함수 호출
        current_user = await get_user_from_token(token) 
        
        if not current_user:
            await websocket.send_json({"type": "error", "payload": {"message": "유효하지 않은 토큰입니다."}})
            await websocket.close(code=1008)
            return
            
        # 인증 성공 응답
        await websocket.send_json({"type": "auth_success", "payload": {"message": "인증 성공."}})
        logger.info(f"WebSocket 인증 성공: {current_user.username}")

        # --- 단계 7-B: 생성 요청 ---
        # 클라이언트로부터 두 번째 메시지(생성 요청)를 기다립니다.
        request_message_raw = await websocket.receive_text()
        request_data = json.loads(request_message_raw)
        
        if request_data.get("type") != "generate_audio":
            raise ValueError("인증 후 잘못된 요청 타입입니다.")
            
        # Pydantic을 사용한 요청 데이터 검증
        request_payload = schemas.AudioGenerateRequest(**request_data.get("payload", {}))
        
        logger.info(f"{current_user.username} 님의 오디오 생성 요청: {request_payload.model_dump_json()}")

        # --- 단계 7-C: 스트리밍 서비스 호출 ---
        # service.py에 새로 만든 스트리밍 함수를 호출합니다.
        # 이 함수가 알아서 websocket.send_json()을 통해 클라이언트에게 모든 메시지를 보냅니다.
        await AudioService.AudioService.generate_full_audio_streaming(
            request=request_payload,
            user=current_user,
            websocket=websocket
        )

    except WebSocketDisconnect:
        logger.info(f"WebSocket 클라이언트 연결 해제됨: {current_user.username if current_user else 'Unknown'}")
    except Exception as e:
        logger.error(f"WebSocket 엔드포인트 오류: {e}", exc_info=True)
        # 클라이언트가 아직 연결되어 있다면 오류 메시지 전송
        try:
            await websocket.send_json({
                "type": "error",
                "payload": {
                    "step_code": "websocket_connection",
                    "message": f"서버 오류가 발생했습니다: {str(e)}"
                }
            })
        except:
            pass # 이미 연결이 끊겼을 수 있음
    finally:
        # 모든 작업이 끝나면 WebSocket 연결을 닫습니다.
        if websocket.client_state.name == 'CONNECTED':
            await websocket.close()
        logger.info("WebSocket 연결 종료됨.")
