import pytest
from types import SimpleNamespace
from decimal import Decimal
from unittest.mock import MagicMock, patch
from backend.app.modules.level_system.utils import (
    get_speed_from_level_score,
    get_cefr_level_from_score,
    get_average_score_and_level,
    normalize_vocab_factor,
    normalize_interaction_factor,
    normalize_understanding_factor,
    normalize_speed_factor,
    _compute_levels_delta_from_weights,
    CEFRLevel,
)
from backend.app.modules.level_system.service import LevelSystemService
from backend.app.modules.level_system import schemas
from backend.app.modules.level_system.builders.director import Director
from backend.app.modules.level_system.builders.normalized_builder import NormalizedInputVectorBuilder
from backend.app.modules.level_system.builders.raw_builder import RawInputVectorBuilder
from fastapi import HTTPException


class TestGetSpeedFromLevelScore:
    """get_speed_from_level_score 함수에 대한 유닛 테스트"""

    def test_boundary_values(self):
        """경계값들이 올바른 속도를 반환하는지 테스트"""
        test_cases = [
            (0, 0.70),      # A1 시작
            (25, 0.80),     # A2 시작 / A1 끝
            (50, 0.90),     # B1 시작 / A2 끝
            (100, 1.00),    # B2 시작 / B1 끝
            (150, 1.10),    # C1 시작 / B2 끝
            (200, 1.15),    # C1 끝
        ]
        
        for level_score, expected_speed in test_cases:
            actual_speed = get_speed_from_level_score(level_score)
            assert actual_speed == expected_speed, (
                f"Level score {level_score}: expected {expected_speed}, got {actual_speed}"
            )

    def test_interpolation(self):
        """구간 내에서 선형 보간이 올바르게 작동하는지 테스트"""
        
        # A1 구간 (0-25): 0.70 -> 0.80
        # 중간값 12.5에서 0.75가 나와야 함
        mid_score = 12.5
        expected_mid_speed = 0.70 + (0.80 - 0.70) * (12.5 / 25)  # 0.75
        actual_mid_speed = get_speed_from_level_score(mid_score)
        assert abs(actual_mid_speed - expected_mid_speed) < 0.01, (
            f"A1 중간값 {mid_score}: expected ~{expected_mid_speed:.3f}, got {actual_mid_speed}"
        )
        
        # A2 구간 (25-50): 0.80 -> 0.90
        # 37.5에서 0.85가 나와야 함
        mid_score = 37.5
        expected_mid_speed = 0.80 + (0.90 - 0.80) * ((37.5 - 25) / (50 - 25))  # 0.85
        actual_mid_speed = get_speed_from_level_score(mid_score)
        assert abs(actual_mid_speed - expected_mid_speed) < 0.01, (
            f"A2 중간값 {mid_score}: expected ~{expected_mid_speed:.3f}, got {actual_mid_speed}"
        )
        
        # B1 구간 (50-100): 0.90 -> 1.00
        # 75에서 0.95가 나와야 함
        mid_score = 75
        expected_mid_speed = 0.90 + (1.00 - 0.90) * ((75 - 50) / (100 - 50))  # 0.95
        actual_mid_speed = get_speed_from_level_score(mid_score)
        assert abs(actual_mid_speed - expected_mid_speed) < 0.01, (
            f"B1 중간값 {mid_score}: expected ~{expected_mid_speed:.3f}, got {actual_mid_speed}"
        )
        
        # B2 구간 (100-150): 1.00 -> 1.10
        # 125에서 1.05가 나와야 함
        mid_score = 125
        expected_mid_speed = 1.00 + (1.10 - 1.00) * ((125 - 100) / (150 - 100))  # 1.05
        actual_mid_speed = get_speed_from_level_score(mid_score)
        assert abs(actual_mid_speed - expected_mid_speed) < 0.01, (
            f"B2 중간값 {mid_score}: expected ~{expected_mid_speed:.3f}, got {actual_mid_speed}"
        )
        
        # C1 구간 (150-200): 1.10 -> 1.15
        # 175에서 1.125가 나와야 함
        mid_score = 175
        expected_mid_speed = 1.10 + (1.15 - 1.10) * ((175 - 150) / (200 - 150))  # 1.125
        actual_mid_speed = get_speed_from_level_score(mid_score)
        assert abs(actual_mid_speed - expected_mid_speed) < 0.01, (
            f"C1 중간값 {mid_score}: expected ~{expected_mid_speed:.3f}, got {actual_mid_speed}"
        )

    def test_edge_cases(self):
        """경계 케이스들을 테스트"""
        
        # 최소값 이하
        assert get_speed_from_level_score(-10) == 0.70
        assert get_speed_from_level_score(0) == 0.70
        
        # 최대값 이상
        assert get_speed_from_level_score(250) == 1.15
        assert get_speed_from_level_score(300) == 1.15
        assert get_speed_from_level_score(1000) == 1.15
        
        # 200 이상은 모두 1.15
        assert get_speed_from_level_score(200) == 1.15
        assert get_speed_from_level_score(225) == 1.15

    def test_precision(self):
        """반환값의 정밀도가 올바른지 테스트 (소수점 둘째 자리까지)"""
        
        # 여러 값들에 대해 소수점 둘째 자리까지만 나오는지 확인
        test_scores = [12.5, 37.5, 75, 125, 175]
        
        for score in test_scores:
            result = get_speed_from_level_score(score)
            # 소수점 둘째 자리까지만 있는지 확인 (round(x, 2) == x)
            assert round(result, 2) == result, (
                f"Score {score}: result {result} should be rounded to 2 decimal places"
            )


class TestCEFRLevelUtils:
    """CEFR 레벨 관련 유틸리티 함수 테스트"""

    def test_get_cefr_level_from_score(self):
        """스코어로부터 CEFR 레벨 추출 테스트"""
        test_cases = [
            (0, CEFRLevel.A1),
            (10, CEFRLevel.A1),
            (24, CEFRLevel.A1),
            (25, CEFRLevel.A2),
            (49, CEFRLevel.A2),
            (50, CEFRLevel.B1),
            (99, CEFRLevel.B1),
            (100, CEFRLevel.B2),
            (149, CEFRLevel.B2),
            (150, CEFRLevel.C1),
            (199, CEFRLevel.C1),
            (200, CEFRLevel.C2),
            (300, CEFRLevel.C2),
        ]
        
        for score, expected_level in test_cases:
            result = get_cefr_level_from_score(score)
            assert result == expected_level, f"Score {score}: expected {expected_level}, got {result}"

    def test_get_average_score_and_level(self):
        """평균 스코어 및 레벨 계산 테스트"""
        # 균등한 레벨
        result = get_average_score_and_level(100.0, 100.0, 100.0)
        assert result["average_score"] == 100.0
        assert result["average_level"] == CEFRLevel.B2
        
        # 다른 레벨들
        result = get_average_score_and_level(50.0, 100.0, 150.0)
        assert result["average_score"] == 100.0
        assert result["average_level"] == CEFRLevel.B2
        
        # 낮은 레벨
        result = get_average_score_and_level(0.0, 10.0, 20.0)
        assert result["average_score"] == 10.0
        assert result["average_level"] == CEFRLevel.A1


class TestNormalizationFunctions:
    """정규화 함수들에 대한 테스트"""

    def test_normalize_interaction_factor(self):
        """pause_cnt와 rewind_cnt 정규화 테스트"""
        pause, rewind = normalize_interaction_factor(5, 3)
        assert pause == 3  # 5 - 2
        assert rewind == 1  # 3 - 2
        
        pause, rewind = normalize_interaction_factor(0, 0)
        assert pause == -2
        assert rewind == -2

    def test_normalize_understanding_factor(self):
        """이해도 정규화 테스트"""
        # 0~4 범위에서 2를 뺀 값
        assert normalize_understanding_factor(0) == -2
        assert normalize_understanding_factor(2) == 0
        assert normalize_understanding_factor(4) == 2

    def test_normalize_speed_factor(self):
        """속도 난이도 정규화 테스트"""
        # 0~4 범위에서 2를 뺀 값
        assert normalize_speed_factor(0) == -2
        assert normalize_speed_factor(2) == 0
        assert normalize_speed_factor(4) == 2

    def test_normalize_vocab_factor(self):
        """단어 조회/저장 정규화 테스트"""
        # Mock DB와 GeneratedContent 생성
        mock_db = MagicMock()
        mock_content = MagicMock()
        mock_content.script_data = "word " * 100  # 100 단어
        mock_db.query.return_value.filter.return_value.first.return_value = mock_content
        
        # 단어 조회가 없는 경우
        lookup, save = normalize_vocab_factor(mock_db, 1, 0, 0)
        assert lookup == 1.0
        assert save == 1.0
        
        # 적은 조회 (5개 = 5%)
        lookup, save = normalize_vocab_factor(mock_db, 1, 5, 0)
        assert lookup == 0.5
        
        # 많은 조회 (20개 = 20%, 15% 이상)
        lookup, save = normalize_vocab_factor(mock_db, 1, 20, 0)
        assert lookup == -1.0


class TestComputeLevelsDelta:
    """레벨 변화량 계산 함수 테스트"""

    def test_compute_levels_delta_basic(self):
        """기본 가중치 행렬 계산 테스트"""
        vector = [0, 0, 0, 0, 0, 0]  # 모두 0인 벡터
        W = [
            [-0.4, -1.2, 0],
            [-0.4, -0.8, -1.2],
            [2.4, 0, 0],
            [3.2, 0, 0],
            [0.32, 1.6, 0.64],
            [0, 0, 1.6],
        ]
        
        lexical, syntactic, speed = _compute_levels_delta_from_weights(vector, W)
        assert lexical == 0.0
        assert syntactic == 0.0
        assert speed == 0.0

    def test_compute_levels_delta_with_positive_feedback(self):
        """긍정적 피드백에 대한 계산 테스트"""
        # pause=0, rewind=0, lookup=1, save=1, understanding=2, speed=2
        vector = [0, 0, 1, 1, 2, 2]
        W = [
            [-0.4, -1.2, 0],
            [-0.4, -0.8, -1.2],
            [2.4, 0, 0],
            [3.2, 0, 0],
            [0.32, 1.6, 0.64],
            [0, 0, 1.6],
        ]
        
        lexical, syntactic, speed = _compute_levels_delta_from_weights(vector, W)
        # lexical = 0*(-0.4) + 0*(-0.4) + 1*2.4 + 1*3.2 + 2*0.32 + 2*0 = 6.24
        # syntactic = 0*(-1.2) + 0*(-0.8) + 1*0 + 1*0 + 2*1.6 + 2*0 = 3.2
        # speed = 0*0 + 0*(-1.2) + 1*0 + 1*0 + 2*0.64 + 2*1.6 = 4.48
        assert lexical == 6.24
        assert syntactic == 3.2
        assert speed == 4.48

    def test_compute_levels_delta_with_clipping(self):
        """클리핑 범위가 적용되는지 테스트"""
        vector = [10, 10, 10, 10, 10, 10]  # 매우 큰 값
        W = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
        ]
        clip_ranges = {
            "lexical": (-5.0, 5.0),
            "syntactic": (-5.0, 5.0),
            "speed": (-5.0, 5.0),
        }
        
        lexical, syntactic, speed = _compute_levels_delta_from_weights(vector, W, clip_ranges)
        assert lexical == 5.0  # 60이 5로 클리핑됨
        assert syntactic == 5.0
        assert speed == 5.0


class TestDirectorAndBuilder:
    """Director와 Builder 패턴 테스트"""

    def test_normalized_builder_builds_vector(self):
        """NormalizedInputVectorBuilder가 올바른 벡터를 생성하는지 테스트"""
        # Mock DB와 피드백 생성
        mock_db = MagicMock()
        mock_content = MagicMock()
        mock_content.script_data = "word " * 100
        mock_db.query.return_value.filter.return_value.first.return_value = mock_content
        
        feedback = schemas.SessionFeedbackRequest(
            generated_content_id=1,
            pause_cnt=5,
            rewind_cnt=3,
            vocab_lookup_cnt=0,
            vocab_save_cnt=0,
            understanding_difficulty=2,
            speed_difficulty=2,
        )
        
        builder = NormalizedInputVectorBuilder(db=mock_db, feedback=feedback)
        director = Director(builder)
        vector = director.buildInputVector()
        
        # 벡터는 [pause, rewind, lookup, save, understanding, speed] 형태
        assert len(vector) == 6
        assert vector[0] == 3  # pause_cnt - 2
        assert vector[1] == 1  # rewind_cnt - 2
        assert vector[2] == 1.0  # vocab_lookup 정규화 (0개)
        assert vector[3] == 1.0  # vocab_save 정규화 (0개)
        assert vector[4] == 0  # understanding - 2
        assert vector[5] == 0  # speed - 2


class TestRawBuilder:
    """RawInputVectorBuilder 테스트"""

    def test_raw_builder_builds_vector_without_normalization(self):
        """RawInputVectorBuilder가 정규화 없이 원시 값으로 벡터를 생성하는지 테스트"""
        feedback = schemas.SessionFeedbackRequest(
            generated_content_id=1,
            pause_cnt=5,
            rewind_cnt=3,
            vocab_lookup_cnt=10,
            vocab_save_cnt=7,
            understanding_difficulty=2,
            speed_difficulty=4,
        )
        
        builder = RawInputVectorBuilder(feedback=feedback)
        director = Director(builder)
        vector = director.buildInputVector()
        
        # 벡터는 [pause, rewind, lookup, save, understanding, speed] 형태
        assert len(vector) == 6
        assert vector[0] == 5  # pause_cnt (정규화 없음)
        assert vector[1] == 3  # rewind_cnt (정규화 없음)
        assert vector[2] == 10  # vocab_lookup_cnt (정규화 없음)
        assert vector[3] == 7  # vocab_save_cnt (정규화 없음)
        assert vector[4] == 2  # understanding_difficulty (정규화 없음)
        assert vector[5] == 4  # speed_difficulty (정규화 없음)

    def test_raw_builder_with_zero_values(self):
        """RawInputVectorBuilder가 0 값들을 올바르게 처리하는지 테스트"""
        feedback = schemas.SessionFeedbackRequest(
            generated_content_id=1,
            pause_cnt=0,
            rewind_cnt=0,
            vocab_lookup_cnt=0,
            vocab_save_cnt=0,
            understanding_difficulty=0,
            speed_difficulty=0,
        )
        
        builder = RawInputVectorBuilder(feedback=feedback)
        director = Director(builder)
        vector = director.buildInputVector()
        
        # 모든 값이 0이어야 함
        assert all(v == 0 for v in vector)


class TestLevelSystemService:
    """LevelSystemService의 메서드들에 대한 단위 테스트"""

    @pytest.fixture
    def service(self):
        """LevelSystemService 인스턴스"""
        return LevelSystemService()

    @pytest.fixture
    def mock_db(self):
        """Mock DB 세션"""
        db = MagicMock()
        return db

    @pytest.fixture
    def mock_user(self):
        """Mock User 객체"""
        user = MagicMock()
        user.lexical_level = Decimal("100.0")
        user.syntactic_level = Decimal("100.0")
        user.speed_level = Decimal("100.0")
        return user

    def test_set_manual_level_valid(self, service, mock_db, mock_user):
        """수동 레벨 설정 - 유효한 입력"""
        payload = schemas.ManualLevelRequest(level="B2")
        
        result = service.set_manual_level(mock_db, mock_user, payload)
        
        assert result["success"] is True
        assert result["success"] is True
        assert result["lexical"]["score"] == 100.0
        assert result["syntactic"]["score"] == 100.0
        assert result["auditory"]["score"] == 100.0
        assert mock_user.lexical_level == 100.0

    def test_set_manual_level_invalid(self, service, mock_db, mock_user):
        """수동 레벨 설정 - 잘못된 입력"""
        payload = schemas.ManualLevelRequest(level="Z9")
        
        with pytest.raises(HTTPException) as exc_info:
            service.set_manual_level(mock_db, mock_user, payload)
        
        assert exc_info.value.status_code == 400

    def test_initialize_level(self, service, mock_db, mock_user):
        """레벨 초기화 테스트"""
        payload = MagicMock()  # InitialSurveyRequest
        
        result = service.initialize_level(mock_db, mock_user, payload)
        
        # 현재는 모두 100으로 초기화
        assert result["lexical_level"] == 100.0
        assert result["syntactic_level"] == 100.0
        assert result["speed_level"] == 100.0

    def test_evaluate_level_test_average_understanding(self, service, mock_db, mock_user):
        """레벨 테스트 평가 - 평균 이해도 계산"""
        tests = [
            schemas.LevelTestItem(script_id="s1", generated_content_id=1, understanding=80),
            schemas.LevelTestItem(script_id="s2", generated_content_id=2, understanding=80),
            schemas.LevelTestItem(script_id="s3", generated_content_id=3, understanding=80),
        ]
        payload = schemas.LevelTestRequest(level="B1", tests=tests)
        
        result = service.evaluate_level_test(mock_db, mock_user, payload)
        
        assert result["success"] is True
        assert "lexical" in result
        assert "syntactic" in result
        assert "auditory" in result
        assert "overall" in result
        # avg_understanding = 80, diff = 0 → base_score(50)에서 변화 없음
        assert float(mock_user.lexical_level) == 50.0

    def test_evaluate_level_test_high_understanding(self, service, mock_db, mock_user):
        """레벨 테스트 평가 - 높은 이해도"""
        tests = [
            schemas.LevelTestItem(script_id="s1", generated_content_id=1, understanding=100),
            schemas.LevelTestItem(script_id="s2", generated_content_id=2, understanding=100),
        ]
        payload = schemas.LevelTestRequest(level="B1", tests=tests)
        
        result = service.evaluate_level_test(mock_db, mock_user, payload)
        
        assert result["success"] is True
        assert "lexical" in result
        assert "syntactic" in result
        assert "auditory" in result
        assert "overall" in result
        # avg = 100, diff = 20 → B1(50)에서 B2(100) 중간(75)으로
        assert float(mock_user.lexical_level) == 75.0

    def test_evaluate_level_test_low_understanding(self, service, mock_db, mock_user):
        """레벨 테스트 평가 - 낮은 이해도"""
        tests = [
            schemas.LevelTestItem(script_id="s1", generated_content_id=1, understanding=20),
            schemas.LevelTestItem(script_id="s2", generated_content_id=2, understanding=20),
        ]
        payload = schemas.LevelTestRequest(level="B1", tests=tests)
        
        result = service.evaluate_level_test(mock_db, mock_user, payload)
        
        assert result["success"] is True
        assert "lexical" in result
        assert "syntactic" in result
        assert "auditory" in result
        assert "overall" in result
        # avg = 20, diff = -60 → B1(50)에서 A2(25) 방향으로 이동
        expected = 50.0 + (25.0 - 50.0) * (60.0 / 80.0)  # 31.25
        assert abs(float(mock_user.lexical_level) - expected) < 0.1

    def test_evaluate_session_feedback(self, service, mock_db, mock_user):
        """세션 피드백으로 레벨 업데이트 테스트"""
        # Mock GeneratedContent
        mock_content = MagicMock()
        mock_content.script_data = "word " * 100
        mock_db.query.return_value.filter.return_value.first.return_value = mock_content
        
        feedback = schemas.SessionFeedbackRequest(
            generated_content_id=1,
            pause_cnt=2,
            rewind_cnt=2,
            vocab_lookup_cnt=5,
            vocab_save_cnt=0,
            understanding_difficulty=3,
            speed_difficulty=3,
        )
        
        result = service.evaluate_session_feedback(mock_db, mock_user, feedback)
        
        assert "lexical_level" in result
        assert "syntactic_level" in result
        assert "speed_level" in result
        assert "lexical_level_delta" in result
        assert "syntactic_level_delta" in result
        assert "speed_level_delta" in result

    def test_evaluate_session_feedback_level_boundaries(self, service, mock_db, mock_user):
        """레벨 업데이트 시 경계값 테스트 (0~300 범위)"""
        mock_user.lexical_level = Decimal("299.0")
        mock_user.syntactic_level = Decimal("1.0")
        mock_user.speed_level = Decimal("150.0")
        
        mock_content = MagicMock()
        mock_content.script_data = "word " * 100
        mock_db.query.return_value.filter.return_value.first.return_value = mock_content
        
        # 매우 긍정적인 피드백
        feedback = schemas.SessionFeedbackRequest(
            generated_content_id=1,
            pause_cnt=0,
            rewind_cnt=0,
            vocab_lookup_cnt=0,
            vocab_save_cnt=0,
            understanding_difficulty=4,
            speed_difficulty=4,
        )
        
        result = service.evaluate_session_feedback(mock_db, mock_user, feedback)
        
        # 레벨은 0~300 범위 내에 있어야 함
        assert 0 <= result["lexical_level"] <= 300
        assert 0 <= result["syntactic_level"] <= 300
        assert 0 <= result["speed_level"] <= 300
