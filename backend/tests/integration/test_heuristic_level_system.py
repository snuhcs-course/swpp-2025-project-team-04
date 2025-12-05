"""
Level System Endpoints Integration Tests
실제 DB를 사용하여 3개 엔드포인트 테스트
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.modules.audio.model import GeneratedContent
from backend.app.core.config import get_db

API_VERSION = "/api/v1"
client = TestClient(app)

# 테스트용 사용자 정보
TEST_USER = {
    "username": "dummy_1123",
    "password": "dummy_1123",
    "nickname": "dummy_1123"
}


@pytest.fixture(scope="module")
def auth_headers():
    """테스트 사용자 생성 및 로그인하여 인증 토큰 획득"""
    # 기존 사용자 삭제 시도 (있을 경우를 대비)
    try:
        login_response = client.post(
            f"{API_VERSION}/auth/login",
            json={"username": TEST_USER["username"], "password": TEST_USER["password"]}
        )
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)
    except:
        pass
    
    # 새로 회원가입
    signup_response = client.post(
        f"{API_VERSION}/auth/signup",
        json=TEST_USER
    )
    assert signup_response.status_code == 201, f"Signup failed: {signup_response.json()}"
    
    access_token = signup_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    yield headers
    
    # 테스트 후 사용자 삭제
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


@pytest.fixture
def generated_content(auth_headers):
    """테스트용 GeneratedContent 생성"""
    db = next(get_db())
    
    # 사용자 ID 가져오기
    from backend.app.modules.users import crud as user_crud
    user = user_crud.get_user_by_username(db, TEST_USER["username"])
    
    # GeneratedContent 생성
    content = GeneratedContent(
        user_id=user.id,
        title="Test Audio for Level System",
        script_data="This is a test script with multiple words to test the level system functionality. " * 10,
        audio_url="https://example.com/test-audio.mp3",
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    
    yield content
    
    # 정리
    db.delete(content)
    db.commit()
    db.close()


class TestLevelSystemEndpoints:
    """Level System 3개 엔드포인트 통합 테스트"""

    def test_01_set_manual_level(self, auth_headers):
        """POST /level-system/manual-level - 수동 레벨 설정"""
        payload = {"level": "B1"}
        
        response = client.post(
            f"{API_VERSION}/level-system/manual-level",
            json=payload,
            headers=auth_headers
        )
        
        print(f"\n[manual-level] Status: {response.status_code}")
        print(f"[manual-level] Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "lexical" in data
        assert "syntactic" in data
        assert "auditory" in data
        assert "overall" in data

    def test_02_evaluate_level_test(self, auth_headers):
        """POST /level-system/level-test - 레벨 테스트 평가"""
        payload = {
            "level": "B1",
            "tests": [
                {"script_id": "test1", "generated_content_id": 1, "understanding": 80},
                {"script_id": "test2", "generated_content_id": 2, "understanding": 85},
                {"script_id": "test3", "generated_content_id": 3, "understanding": 75},
            ]
        }
        
        response = client.post(
            f"{API_VERSION}/level-system/level-test",
            json=payload,
            headers=auth_headers
        )
        
        print(f"\n[level-test] Status: {response.status_code}")
        print(f"[level-test] Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "lexical" in data
        assert "syntactic" in data
        assert "auditory" in data
        assert "overall" in data

    def test_03_submit_session_feedback(self, auth_headers, generated_content):
        """POST /level-system/session-feedback - 세션 피드백 제출"""
        payload = {
            "generated_content_id": generated_content.generated_content_id,
            "pause_cnt": 3,
            "rewind_cnt": 2,
            "vocab_lookup_cnt": 5,
            "vocab_save_cnt": 2,
            "understanding_difficulty": 3,
            "speed_difficulty": 2,
        }
        
        response = client.post(
            f"{API_VERSION}/level-system/session-feedback",
            json=payload,
            headers=auth_headers
        )
        
        print(f"\n[session-feedback] Status: {response.status_code}")
        print(f"[session-feedback] Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        # 응답에 필수 필드가 있는지만 확인
        assert "lexical_level" in data
        assert "syntactic_level" in data
        assert "speed_level" in data
        assert "lexical_level_delta" in data
        assert "syntactic_level_delta" in data
        assert "speed_level_delta" in data

    def test_04_workflow_sequence(self, auth_headers, generated_content):
        """전체 워크플로우: manual-level → level-test → session-feedback"""
        
        # 1. 수동 레벨 설정
        response = client.post(
            f"{API_VERSION}/level-system/manual-level",
            json={"level": "A2"},
            headers=auth_headers
        )
        assert response.status_code == 200
        print(f"\n[Workflow Step 1] Manual level set: {response.json()}")
        
        # 2. 레벨 테스트
        response = client.post(
            f"{API_VERSION}/level-system/level-test",
            json={
                "level": "A2",
                "tests": [
                    {"script_id": "s1", "generated_content_id": 1, "understanding": 90},
                ]
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        print(f"[Workflow Step 2] Level test: {response.json()}")
        
        # 3. 세션 피드백
        response = client.post(
            f"{API_VERSION}/level-system/session-feedback",
            json={
                "generated_content_id": generated_content.generated_content_id,
                "pause_cnt": 1,
                "rewind_cnt": 1,
                "vocab_lookup_cnt": 3,
                "vocab_save_cnt": 1,
                "understanding_difficulty": 3,
                "speed_difficulty": 3,
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        print(f"[Workflow Step 3] Session feedback: {response.json()}")

    def test_05_unauthorized_access(self):
        """인증 없이 접근 시 401 또는 403 에러"""
        
        # manual-level
        response = client.post(
            f"{API_VERSION}/level-system/manual-level",
            json={"level": "B1"}
        )
        assert response.status_code in [401, 403]
        
        # level-test
        response = client.post(
            f"{API_VERSION}/level-system/level-test",
            json={"level": "B1", "tests": []}
        )
        assert response.status_code in [401, 403]
        
        # session-feedback
        response = client.post(
            f"{API_VERSION}/level-system/session-feedback",
            json={"generated_content_id": 1, "pause_cnt": 0}
        )
        assert response.status_code in [401, 403]
        
        print(f"\n[Unauthorized] All endpoints correctly return 401 or 403")
