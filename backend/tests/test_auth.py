
from backend.tests.test_main import client
import json

API_VERSION = "/api/v1"

DUMMY_USER_USERNAME="testuser123"  
DUMMY_USER_PASSWORD="testuser123!"  

def test_signup_success():
    signup_data = {
        "username": "signuptest123",
        "password": "signuptest123!"
        # No nickname provided - should default to username
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["username"] == "signuptest123"
    assert response_data["user"]["nickname"] == "signuptest123"  # Should default to username
    assert "id" in response_data["user"]
    
    # Clean up - delete the test user
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_signup_with_custom_nickname():
    ''' Test successful signup with custom nickname '''
    signup_data = {
        "username": "signuptest456",
        "password": "signuptest456!",
        "nickname": "customnick456"
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["username"] == "signuptest456"
    assert response_data["user"]["nickname"] == "customnick456"  # Should use provided nickname
    assert "id" in response_data["user"]
    
    # Clean up - delete the test user
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


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
    assert "user" in response_data
    assert response_data["user"]["username"] == DUMMY_USER_USERNAME


def test_login_failure():
    ''' invalid input에 대한 failure test '''
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": "dummy_user123!!"
    }
    response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_CREDENTIALS"


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
    reissue_response = client.post(f"{API_VERSION}/auth/refresh/access", json=reissue_data)
    
    assert reissue_response.status_code == 200
    reissue_response_data = reissue_response.json()
    assert "access_token" in reissue_response_data


def test_reissue_access_token_invalid_refresh_token():
    ''' 잘못된 refresh token 으로 access token 발급 시 401 에러 테스트 '''

    reissue_data = {
        "refresh_token": "invalid_refresh_token"
    }
    reissue_response = client.post(f"{API_VERSION}/auth/refresh/access", json=reissue_data)
    
    reissue_response_data = reissue_response.json()
    assert reissue_response_data["custom_code"] == "INVALID_TOKEN"


def test_reissue_access_token_with_access_token():
    ''' access token으로 access token 재발급 시도 시 토큰 타입 에러 테스트 '''
    
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": DUMMY_USER_PASSWORD
    }
    login_response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    login_response_data = login_response.json()
    access_token = login_response_data["access_token"]
    
    reissue_data = {
        "refresh_token": access_token  # refresh_token 자리에 access_token 사용
    }
    reissue_response = client.post(f"{API_VERSION}/auth/refresh/access", json=reissue_data)
    
    reissue_response_data = reissue_response.json()
    assert reissue_response_data["custom_code"] == "INVALID_TOKEN_TYPE"


def test_delete_account_success():
    ''' 계정 삭제 성공 테스트 '''
    
    # 먼저 로그인 시도
    login_data = {
        "username": "testuser1234",
        "password": "testuser1234!"
    }
    login_response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    if login_response.status_code == 200:
        # 계정이 이미 존재함
        login_response_data = login_response.json()
        access_token = login_response_data["access_token"]
    else:
        # 계정이 없으므로 새로 생성
        signup_data = {
            "username": "testuser1234",
            "password": "testuser1234!",
            "nickname": "testnick1234"
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
    
    delete_response_data = delete_response.json()
    assert delete_response_data["custom_code"] == "INVALID_TOKEN"