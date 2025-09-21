
from backend.tests.test_main import client
import json

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


def test_logout_success():
    ''' 로그아웃 성공 테스트 '''
    
    # 먼저 로그인하여 토큰들을 받아온다
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": DUMMY_USER_PASSWORD
    }
    login_response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    login_response_data = login_response.json()
    access_token = login_response_data["access_token"]
    refresh_token = login_response_data["refresh_token"]
    
    # 로그아웃 시도
    logout_data = {
        "access_token": access_token,
        "refresh_token": refresh_token
    }
    logout_response = client.post(f"{API_VERSION}/auth/logout", json=logout_data)
    
    assert logout_response.status_code == 200
    logout_response_data = logout_response.json()
    assert logout_response_data["message"] == "Successfully logged out"


def test_logout_blocklisted_token_usage():
    ''' 로그아웃 후 블록리스트된 토큰 사용 시 401 에러 테스트 '''
    
    # 먼저 로그인하여 토큰들을 받아온다
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": DUMMY_USER_PASSWORD
    }
    login_response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    login_response_data = login_response.json()
    access_token = login_response_data["access_token"]
    refresh_token = login_response_data["refresh_token"]
    
    # 로그아웃
    logout_data = {
        "access_token": access_token,
        "refresh_token": refresh_token
    }
    logout_response = client.post(f"{API_VERSION}/auth/logout", json=logout_data)
    assert logout_response.status_code == 200
    
    # 블록리스트된 refresh token으로 access token 재발급 시도 (실패해야 함)
    reissue_data = {
        "refresh_token": refresh_token
    }
    reissue_response = client.post(f"{API_VERSION}/auth/reissue/access", json=reissue_data)
    
    assert reissue_response.status_code == 401
    reissue_response_data = reissue_response.json()
    assert reissue_response_data["detail"] == "Token has been revoked"

def test_delete_account_success():
    ''' 계정 삭제 성공 테스트 '''
    
    # 먼저 로그인 시도
    login_data = {
        "username": "test_delete_user",
        "password": "test_password123"
    }
    login_response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    if login_response.status_code == 200:
        # 계정이 이미 존재함
        login_response_data = login_response.json()
        access_token = login_response_data["access_token"]
    else:
        # 계정이 없으므로 새로 생성
        signup_data = {
            "username": "test_delete_user",
            "password": "test_password123"
        }
        signup_response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
        assert signup_response.status_code == 201
        
        signup_response_data = signup_response.json()
        access_token = signup_response_data["access_token"]
    
    # 계정 삭제 시도
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    delete_response = client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)
    
    assert delete_response.status_code == 200
    delete_response_data = delete_response.json()
    assert delete_response_data["message"] == "Account deleted successfully"



def test_delete_account_invalid_token():
    ''' 잘못된 토큰으로 계정 삭제 시 401 에러 테스트 '''

    headers = {
        "Authorization": "Bearer invalid_token"
    }
    delete_response = client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)
    
    assert delete_response.status_code == 401
    delete_response_data = delete_response.json()
    assert delete_response_data["detail"] == "Invalid token"
