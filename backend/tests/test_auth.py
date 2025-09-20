
from backend.tests.test_main import client

API_VERSION = "/api/v1"

DUMMY_USER_USERNAME="test_login_target"
DUMMY_USER_PASSWORD= "test_login_target" # 이 계정은 DB에 있다고 가정(삭제 x)

def test_login_success():
    ''' valid input에 대한 success test '''
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": DUMMY_USER_PASSWORD
    } 

    response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    assert response.status_code == 200
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data


def test_login_failure():
    ''' invalid input에 대한 failure test '''
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": "wrong_password"
    }
    response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    assert response.status_code == 401
    response_data = response.json()
    assert response_data["detail"] == "Invalid username or password"


def test_reissue_access_token_success():
    ''' refresh token으로 access token 재발급 성공 테스트 '''
    
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": DUMMY_USER_PASSWORD
    }
    login_response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    login_response_data = login_response.json()
    refresh_token = login_response_data["refresh_token"]
    
    # refresh token으로 access token 재발급 시도
    reissue_data = {
        "refresh_token": refresh_token
    }
    reissue_response = client.post(f"{API_VERSION}/auth/reissue/access", json=reissue_data)
    
    assert reissue_response.status_code == 200
    reissue_response_data = reissue_response.json()
    assert "access_token" in reissue_response_data


def test_reissue_access_token_invalid_refresh_token():
    ''' 잘못된 refresh token 으로 access token 발급 시 401 에러 테스트 '''

    reissue_data = {
        "refresh_token": "invalid_refresh_token"
    }
    reissue_response = client.post(f"{API_VERSION}/auth/reissue/access", json=reissue_data)
    
    assert reissue_response.status_code == 401
    reissue_response_data = reissue_response.json()
    assert reissue_response_data["detail"] == "Invalid token"