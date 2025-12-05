"""
Vocab Endpoints Integration Tests
실제 DB를 사용하여 vocab 관련 엔드포인트 테스트
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.modules.audio.model import GeneratedContent
from backend.app.core.config import get_db

API_VERSION = "/api/v1"
client = TestClient(app)

# 테스트용 사용자 정보
TEST_USER = {
    "username": "vocab_test_user_1123",
    "password": "vocab_test_1123",
    "nickname": "vocab_tester"
}


@pytest.fixture(scope="module")
def auth_headers():
    """테스트 사용자 생성 및 로그인하여 인증 토큰 획득"""
    # 기존 사용자 삭제 시도
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
    try:
        client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)
    except:
        pass


@pytest.fixture(scope="module")
def sample_generated_content(auth_headers):
    """테스트용 GeneratedContent 생성"""
    db = next(get_db())
    
    # script_vocabs 데이터 준비
    script_vocabs = {
        "sentences": [
            {
                "index": 0,
                "text": "Hello world",
                "words": [
                    {"word": "Hello", "pos": "감탄사", "meaning": "안녕"},
                    {"word": "world", "pos": "명사", "meaning": "세계"}
                ]
            },
            {
                "index": 1,
                "text": "Good morning",
                "words": [
                    {"word": "Good", "pos": "형용사", "meaning": "좋은"},
                    {"word": "morning", "pos": "명사", "meaning": "아침"}
                ]
            }
        ]
    }
    
    # user_id 가져오기
    from backend.app.modules.users.crud import get_user_by_username
    user = get_user_by_username(db, TEST_USER["username"])
    
    # GeneratedContent 생성
    content = GeneratedContent(
        user_id=user.id,
        title="Test Content",
        audio_url="https://example.com/test.mp3",
        script_data="Hello world. Good morning.",
        script_vocabs=script_vocabs
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    
    content_id = content.generated_content_id
    
    yield content_id
    
    # cleanup
    db.query(GeneratedContent).filter(
        GeneratedContent.generated_content_id == content_id
    ).delete()
    db.commit()
    db.close()


class TestVocabEndpoints:
    """Vocab 엔드포인트 통합 테스트"""

    def test_get_my_vocab_empty(self, auth_headers):
        """초기 상태에서 빈 vocab 목록 조회"""
        response = client.get(f"{API_VERSION}/vocabs/me", headers=auth_headers)
        assert response.status_code == 200
        # 이전 테스트에서 추가된 vocab이 있을 수 있으므로 list 타입만 확인
        assert isinstance(response.json(), list)

    def test_get_my_vocab_unauthorized(self):
        """인증 없이 vocab 조회 시 에러 발생"""
        response = client.get(f"{API_VERSION}/vocabs/me")
        assert response.status_code >= 400  # 4xx 에러면 됨

    def test_get_script_vocabs_success(self, sample_generated_content):
        """generated_content의 script_vocabs 조회 성공"""
        response = client.get(f"{API_VERSION}/vocabs/{sample_generated_content}")
        assert response.status_code == 200
        data = response.json()
        assert "sentences" in data
        assert len(data["sentences"]) == 2

    def test_get_script_vocabs_not_found(self):
        """존재하지 않는 content_id로 조회 시 404"""
        response = client.get(f"{API_VERSION}/vocabs/999999")
        assert response.status_code == 404

    def test_get_contextual_word_full_sentence(self, sample_generated_content):
        """특정 문장의 전체 단어 목록 조회"""
        response = client.get(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["index"] == 0
        assert data["text"] == "Hello world"
        assert len(data["words"]) == 2

    def test_get_contextual_word_specific_word(self, sample_generated_content):
        """특정 단어만 조회"""
        response = client.get(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0?word=hello"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["word"] == "Hello"
        assert data["pos"] == "감탄사"
        assert data["meaning"] == "안녕"

    def test_get_contextual_word_not_found(self, sample_generated_content):
        """존재하지 않는 단어 조회 시 404"""
        response = client.get(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0?word=nonexistent"
        )
        assert response.status_code == 404

    def test_get_contextual_word_invalid_index(self, sample_generated_content):
        """존재하지 않는 sentence index 조회 시 404"""
        response = client.get(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/999"
        )
        assert response.status_code == 404

    @patch('backend.app.modules.vocab.endpoints.get_elevenlabs_client')
    @patch('backend.app.modules.vocab.endpoints.upload_audio_to_s3')
    def test_add_word_to_vocab_success(
        self, 
        mock_s3_upload, 
        mock_elevenlabs, 
        sample_generated_content, 
        auth_headers
    ):
        """vocab에 단어 추가 성공 (TTS 및 S3 mock)"""
        # ElevenLabs mock 설정
        mock_client = MagicMock()
        mock_audio_stream = [b'fake', b'audio', b'data']
        mock_client.text_to_speech.convert = MagicMock(return_value=iter(mock_audio_stream))
        mock_elevenlabs.return_value = mock_client
        
        # S3 upload mock
        mock_s3_upload.return_value = "https://s3.example.com/audio.mp3"
        
        response = client.post(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0",
            headers=auth_headers,
            json={"word": "Hello"}
        )
        
        assert response.status_code == 201
        
        # vocab이 실제로 추가되었는지 확인
        vocab_response = client.get(f"{API_VERSION}/vocabs/me", headers=auth_headers)
        assert vocab_response.status_code == 200
        vocabs = vocab_response.json()
        
        # 추가된 vocab 찾기
        added_vocab = next((v for v in vocabs if v["word"] == "hello"), None)
        assert added_vocab is not None
        assert added_vocab["pos"] == "감탄사"
        assert added_vocab["meaning"] == "안녕"
        assert added_vocab["example_sentence"] == "Hello world"

    @patch('backend.app.modules.vocab.endpoints.get_elevenlabs_client')
    @patch('backend.app.modules.vocab.endpoints.upload_audio_to_s3')
    def test_add_word_to_vocab_word_not_found(
        self, 
        mock_s3_upload, 
        mock_elevenlabs, 
        sample_generated_content, 
        auth_headers
    ):
        """존재하지 않는 단어를 vocab에 추가 시도 시 404"""
        response = client.post(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0",
            headers=auth_headers,
            json={"word": "nonexistent"}
        )
        assert response.status_code == 404

    @patch('backend.app.modules.vocab.endpoints.get_elevenlabs_client')
    def test_add_word_to_vocab_tts_failure(
        self, 
        mock_elevenlabs, 
        sample_generated_content, 
        auth_headers
    ):
        """TTS 생성 실패 시 500 에러"""
        # ElevenLabs API 실패 시뮬레이션
        mock_elevenlabs.side_effect = Exception("TTS API Error")
        
        response = client.post(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0",
            headers=auth_headers,
            json={"word": "world"}
        )
        assert response.status_code == 500

    def test_add_word_to_vocab_unauthorized(self, sample_generated_content):
        """인증 없이 vocab 추가 시도 시 에러 발생"""
        response = client.post(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/0",
            json={"word": "Hello"}
        )
        assert response.status_code >= 400  # 4xx 에러면 됨

    @patch('backend.app.modules.vocab.endpoints.get_elevenlabs_client')
    @patch('backend.app.modules.vocab.endpoints.upload_audio_to_s3')
    def test_delete_vocab_entry_success(
        self, 
        mock_s3_upload, 
        mock_elevenlabs, 
        sample_generated_content, 
        auth_headers
    ):
        """vocab 항목 삭제 성공"""
        # 먼저 vocab 추가
        mock_client = MagicMock()
        mock_audio_stream = [b'fake', b'audio', b'data']
        mock_client.text_to_speech.convert = MagicMock(return_value=iter(mock_audio_stream))
        mock_elevenlabs.return_value = mock_client
        mock_s3_upload.return_value = "https://s3.example.com/audio.mp3"
        
        add_response = client.post(
            f"{API_VERSION}/vocabs/{sample_generated_content}/sentences/1",
            headers=auth_headers,
            json={"word": "Good"}
        )
        assert add_response.status_code == 201
        
        # 추가된 vocab의 ID 찾기
        vocab_response = client.get(f"{API_VERSION}/vocabs/me", headers=auth_headers)
        vocabs = vocab_response.json()
        target_vocab = next((v for v in vocabs if v["word"] == "good"), None)
        assert target_vocab is not None
        
        # 삭제
        delete_response = client.delete(
            f"{API_VERSION}/vocabs/me/{target_vocab['id']}",
            headers=auth_headers
        )
        assert delete_response.status_code == 204
        
        # 삭제 확인
        vocab_after = client.get(f"{API_VERSION}/vocabs/me", headers=auth_headers).json()
        assert not any(v["id"] == target_vocab["id"] for v in vocab_after)

    def test_delete_vocab_entry_not_found(self, auth_headers):
        """존재하지 않는 vocab 항목 삭제 시 404"""
        response = client.delete(
            f"{API_VERSION}/vocabs/me/999999",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_delete_vocab_entry_unauthorized(self):
        """인증 없이 vocab 삭제 시도 시 에러 발생"""
        response = client.delete(f"{API_VERSION}/vocabs/me/1")
        assert response.status_code >= 400  # 4xx 에러면 됨

    def test_delete_vocab_entry_other_user(self, auth_headers, sample_generated_content):
        """다른 사용자의 vocab 항목 삭제 시도 시 404"""
        # 다른 사용자 생성
        other_user = {
            "username": "other_vocab_user",
            "password": "other_pass",
            "nickname": "other"
        }
        
        try:
            # 기존 사용자 삭제
            login_resp = client.post(
                f"{API_VERSION}/auth/login",
                json={"username": other_user["username"], "password": other_user["password"]}
            )
            if login_resp.status_code == 200:
                token = login_resp.json()["access_token"]
                client.delete(
                    f"{API_VERSION}/auth/delete-account",
                    headers={"Authorization": f"Bearer {token}"}
                )
        except:
            pass
        
        # 다른 사용자 생성
        signup_resp = client.post(f"{API_VERSION}/auth/signup", json=other_user)
        other_headers = {"Authorization": f"Bearer {signup_resp.json()['access_token']}"}
        
        # 원래 사용자의 vocab 조회
        vocab_response = client.get(f"{API_VERSION}/vocabs/me", headers=auth_headers)
        vocabs = vocab_response.json()
        
        if len(vocabs) > 0:
            # 다른 사용자로 첫 번째 vocab 삭제 시도
            delete_response = client.delete(
                f"{API_VERSION}/vocabs/me/{vocabs[0]['id']}",
                headers=other_headers
            )
            assert delete_response.status_code == 404
        
        # cleanup
        try:
            client.delete(f"{API_VERSION}/auth/delete-account", headers=other_headers)
        except:
            pass
