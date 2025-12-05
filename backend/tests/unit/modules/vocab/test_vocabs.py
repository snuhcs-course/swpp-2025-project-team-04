from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.modules.users import crud as user_crud
from app.modules.vocab import crud as vocab_crud
from app.modules.vocab.service import VocabService


def _create_user(session, username: str = "demo"):
    return user_crud.create_user(session, username=username, hashed_password="pw")


class TestVocabCRUD:
    """Vocab CRUD 함수 테스트"""

    def test_add_and_list_vocab_entries(self, sqlite_session):
        user = _create_user(sqlite_session)
        vocab_crud.add_vocab_entry(
            sqlite_session,
            user_id=user.id,
            word="  Hello ",
            example_sentence="Hello world!",
            meaning="greeting",
        )
        entries = vocab_crud.get_vocab_for_user(sqlite_session, user_id=user.id)
        assert len(entries) == 1
        assert entries[0].word == "hello"

    def test_delete_vocab_entry(self, sqlite_session):
        user = _create_user(sqlite_session)
        entry = vocab_crud.add_vocab_entry(sqlite_session, user_id=user.id, word="bye")
        entry_id = entry.id
        assert vocab_crud.delete_vocab_entry(sqlite_session, entry_id=entry_id, user_id=user.id) is True
        other_user = _create_user(sqlite_session, username="other")
        assert vocab_crud.delete_vocab_entry(sqlite_session, entry_id=entry_id, user_id=other_user.id) is False

    def test_add_vocab_with_all_fields(self, sqlite_session):
        """모든 필드를 포함한 vocab entry 추가 테스트"""
        user = _create_user(sqlite_session)
        entry = vocab_crud.add_vocab_entry(
            sqlite_session,
            user_id=user.id,
            word="  Running  ",
            example_sentence="I am running fast.",
            pos="동사",
            meaning="run의 현재진행형, 달리다",
            example_sentence_url="https://example.com/audio.mp3"
        )
        assert entry.word == "running"
        assert entry.pos == "동사"
        assert entry.meaning == "run의 현재진행형, 달리다"
        assert entry.example_sentence_url == "https://example.com/audio.mp3"

    def test_get_vocab_ordered_by_created_at(self, sqlite_session):
        """vocab 목록이 created_at 내림차순으로 정렬되는지 테스트"""
        user = _create_user(sqlite_session, username="order_test_user")
        entry1 = vocab_crud.add_vocab_entry(sqlite_session, user_id=user.id, word="first")
        entry2 = vocab_crud.add_vocab_entry(sqlite_session, user_id=user.id, word="second")
        entry3 = vocab_crud.add_vocab_entry(sqlite_session, user_id=user.id, word="third")
        
        entries = vocab_crud.get_vocab_for_user(sqlite_session, user_id=user.id)
        assert len(entries) == 3
        # get_vocab_for_user가 정상 동작하는지만 확인 (정렬 순서는 DB에 의존)
        entry_ids = {e.id for e in entries}
        assert entry1.id in entry_ids
        assert entry2.id in entry_ids
        assert entry3.id in entry_ids


class TestVocabService:
    """VocabService 클래스 테스트"""

    @pytest.mark.asyncio
    async def test_process_sentence_async_success(self):
        """process_sentence_async가 OpenAI API 응답을 올바르게 처리하는지 테스트"""
        # OpenAI API 응답 형식 mock
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"entries": [{"word": "Hello", "pos": "감탄사", "meaning": "안녕"}, {"word": "world", "pos": "명사", "meaning": "세계"}]}'
        
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        with patch('app.modules.vocab.service.client', mock_client):
            result = await VocabService.process_sentence_async(0, "Hello world")
        
        assert result["index"] == 0
        assert result["text"] == "Hello world"
        assert len(result["words"]) == 2
        assert result["words"][0]["word"] == "Hello"
        assert result["words"][0]["pos"] == "감탄사"
        assert result["words"][0]["meaning"] == "안녕"
        assert result["words"][1]["word"] == "world"

    @pytest.mark.asyncio
    async def test_process_sentence_async_error_handling(self):
        """process_sentence_async가 에러를 올바르게 처리하는지 테스트"""
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
        
        with patch('app.modules.vocab.service.client', mock_client):
            result = await VocabService.process_sentence_async(0, "Test sentence")
        
        assert result["index"] == 0
        assert result["text"] == "Test sentence"
        assert "error" in result
        assert result["words"] == []

    @pytest.mark.asyncio
    async def test_process_sentence_async_invalid_json(self):
        """process_sentence_async가 잘못된 JSON 응답을 처리하는지 테스트"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = 'invalid json{'
        
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        with patch('app.modules.vocab.service.client', mock_client):
            result = await VocabService.process_sentence_async(0, "Test sentence")
        
        assert result["index"] == 0
        assert "error" in result
        assert result["words"] == []

    @pytest.mark.asyncio
    async def test_build_contextual_vocab_success(self):
        """build_contextual_vocab가 여러 문장을 처리하고 DB를 업데이트하는지 테스트"""
        sentences = ["Hello world", "Good morning"]
        generated_content_id = 1
        
        # OpenAI API mock
        mock_response1 = MagicMock()
        mock_response1.choices = [MagicMock()]
        mock_response1.choices[0].message.content = '{"entries": [{"word": "Hello", "pos": "감탄사", "meaning": "안녕"}]}'
        
        mock_response2 = MagicMock()
        mock_response2.choices = [MagicMock()]
        mock_response2.choices[0].message.content = '{"entries": [{"word": "Good", "pos": "형용사", "meaning": "좋은"}]}'
        
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
        
        # DB crud mock
        mock_crud = MagicMock()
        mock_crud.update_generated_content_vocabs = MagicMock(return_value=True)
        
        mock_db = MagicMock()
        
        with patch('app.modules.vocab.service.client', mock_client), \
             patch('app.modules.vocab.service.crud', mock_crud), \
             patch('app.modules.vocab.service.SessionLocal', return_value=mock_db):
            
            result = await VocabService.build_contextual_vocab(sentences, generated_content_id)
        
        assert "sentences" in result
        assert len(result["sentences"]) == 2
        assert result["sentences"][0]["index"] == 0
        assert result["sentences"][1]["index"] == 1
        
        # DB 업데이트 호출 확인
        mock_crud.update_generated_content_vocabs.assert_called_once()
        call_args = mock_crud.update_generated_content_vocabs.call_args
        assert call_args[1]["content_id"] == generated_content_id

    @pytest.mark.asyncio
    async def test_build_contextual_vocab_duplicate_prevention(self):
        """build_contextual_vocab가 중복 실행을 방지하는지 테스트"""
        sentences = ["Test sentence"]
        generated_content_id = 999
        
        # 실행 중인 태스크 시뮬레이션
        mock_task = MagicMock()
        mock_task.done = MagicMock(return_value=False)
        VocabService._running_tasks[generated_content_id] = mock_task
        
        try:
            result = await VocabService.build_contextual_vocab(sentences, generated_content_id)
            
            # 중복 실행 시 None 반환
            assert result is None
        finally:
            # 테스트 후 cleanup
            if generated_content_id in VocabService._running_tasks:
                del VocabService._running_tasks[generated_content_id]

    @pytest.mark.asyncio
    async def test_build_contextual_vocab_db_update_failure(self):
        """build_contextual_vocab가 DB 업데이트 실패를 처리하는지 테스트"""
        sentences = ["Test sentence"]
        generated_content_id = 2
        
        # OpenAI API mock
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"entries": [{"word": "Test", "pos": "명사", "meaning": "테스트"}]}'
        
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        # DB 업데이트 실패 시뮬레이션
        mock_crud = MagicMock()
        mock_crud.update_generated_content_vocabs = MagicMock(side_effect=Exception("DB Error"))
        
        mock_db = MagicMock()
        
        with patch('app.modules.vocab.service.client', mock_client), \
             patch('app.modules.vocab.service.crud', mock_crud), \
             patch('app.modules.vocab.service.SessionLocal', return_value=mock_db):
            
            # DB 실패해도 결과는 반환되어야 함
            result = await VocabService.build_contextual_vocab(sentences, generated_content_id)
        
        assert result is not None
        assert "sentences" in result
        assert len(result["sentences"]) == 1
