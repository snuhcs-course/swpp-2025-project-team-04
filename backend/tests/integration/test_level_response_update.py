"""
Level System Response Structure Tests
Verifies that level-test and manual-level endpoints return the detailed score structure.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import get_db

API_VERSION = "/api/v1"
client = TestClient(app)

# Test User
TEST_USER = {
    "username": "response_test_user",
    "password": "password123",
    "nickname": "response_tester"
}

@pytest.fixture(scope="module")
def auth_headers():
    """Create test user and return auth headers"""
    # Try to delete if exists
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
    
    # Signup
    signup_response = client.post(
        f"{API_VERSION}/auth/signup",
        json=TEST_USER
    )
    assert signup_response.status_code == 201
    
    access_token = signup_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    yield headers
    
    # Cleanup
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)

def test_manual_level_response_structure(auth_headers):
    """Verify manual-level returns detailed structure"""
    payload = {"level": "B1"}
    
    response = client.post(
        f"{API_VERSION}/level-system/manual-level",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check top level keys
    assert data["success"] is True
    assert "lexical" in data
    assert "syntactic" in data
    assert "auditory" in data
    assert "overall" in data
    
    # Check structure of each item
    for key in ["lexical", "syntactic", "auditory", "overall"]:
        assert "cefr_level" in data[key]
        assert "score" in data[key]
        assert isinstance(data[key]["score"], (int, float))
        assert isinstance(data[key]["cefr_level"], str)
        
    # Verify values match what we expect for B1 (approx 50-100)
    # Since we set B1 manually, scores should be set to B1 threshold (50)
    assert data["lexical"]["cefr_level"] == "B1"
    assert data["lexical"]["score"] == 50.0

def test_level_test_response_structure(auth_headers):
    """Verify level-test returns detailed structure"""
    # First set a known level so we have a baseline
    client.post(
        f"{API_VERSION}/level-system/manual-level",
        json={"level": "A2"},
        headers=auth_headers
    )
    
    payload = {
        "level": "A2",
        "tests": [
            {"script_id": "test1", "generated_content_id": 1, "understanding": 90},
        ]
    }
    
    response = client.post(
        f"{API_VERSION}/level-system/level-test",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check top level keys
    assert data["success"] is True
    assert "lexical" in data
    assert "syntactic" in data
    assert "auditory" in data
    assert "overall" in data
    
    # Check structure of each item
    for key in ["lexical", "syntactic", "auditory", "overall"]:
        assert "cefr_level" in data[key]
        assert "score" in data[key]
        assert isinstance(data[key]["score"], (int, float))
        assert isinstance(data[key]["cefr_level"], str)
