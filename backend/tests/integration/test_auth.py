
from backend.tests.integration.test_main import client
import json
from uuid import uuid4
import random
import string

API_VERSION = "/api/v1"

DUMMY_USER_USERNAME="testuser123"  
DUMMY_USER_PASSWORD="testuser123!"  

def test_signup_success():
    username = f"signuptest_{uuid4().hex[:8]}"
    signup_data = {
        "username": username,
        "password": "signuptest123!"
        # No nickname provided - should default to username
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["username"] == username
    assert response_data["user"]["nickname"] == username  # Should default to username
    assert "id" in response_data["user"]
    
    # Clean up - delete the test user
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_signup_with_custom_nickname():
    ''' Test successful signup with custom nickname '''
    username = f"signuptest_{uuid4().hex[:8]}"
    signup_data = {
        "username": username,
        "password": "signuptest456!",
        "nickname": "customnick456"
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["username"] == username
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


def test_change_password_success():
    username = f"cpw{uuid4().hex[:9]}"
    original_password = "ChangePass123!"
    new_password = "NewPass1234!"

    signup_data = {
        "username": username,
        "password": original_password,
        "nickname": "changepw_user"
    }
    signup_response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    assert signup_response.status_code == 201

    access_token = signup_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    change_payload = {
        "current_password": original_password,
        "new_password": new_password
    }
    change_response = client.post(
        f"{API_VERSION}/auth/change-password",
        json=change_payload,
        headers=headers,
    )

    assert change_response.status_code == 200
    assert change_response.json()["message"] == "Password updated successfully"

    old_login_response = client.post(
        f"{API_VERSION}/auth/login",
        json={"username": username, "password": original_password},
    )
    assert old_login_response.status_code == 401
    assert old_login_response.json()["custom_code"] == "INVALID_CREDENTIALS"

    new_login_response = client.post(
        f"{API_VERSION}/auth/login",
        json={"username": username, "password": new_password},
    )
    assert new_login_response.status_code == 200
    new_access_token = new_login_response.json()["access_token"]

    cleanup_headers = {"Authorization": f"Bearer {new_access_token}"}
    delete_response = client.delete(
        f"{API_VERSION}/auth/delete-account",
        headers=cleanup_headers,
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Account deleted successfully"


def test_change_password_invalid_current_password():
    username = f"cpw{uuid4().hex[:9]}"
    password = "StillOriginal123!"

    signup_data = {
        "username": username,
        "password": password,
        "nickname": "changepw_invalid"
    }
    signup_response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    assert signup_response.status_code == 201

    access_token = signup_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    change_payload = {
        "current_password": "WrongPassword123!",
        "new_password": "NewPassword987!"
    }
    change_response = client.post(
        f"{API_VERSION}/auth/change-password",
        json=change_payload,
        headers=headers,
    )

    assert change_response.status_code == 401
    assert change_response.json()["custom_code"] == "INVALID_CREDENTIALS"

    login_response = client.post(
        f"{API_VERSION}/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]

    cleanup_headers = {"Authorization": f"Bearer {access_token}"}
    delete_response = client.delete(
        f"{API_VERSION}/auth/delete-account",
        headers=cleanup_headers,
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Account deleted successfully"


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


# ========== Validation Tests ==========

def test_signup_username_too_short():
    ''' Username이 3자 미만일 때 실패 테스트 '''
    signup_data = {
        "username": "ab",  # 2자
        "password": "validpass123"
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_USERNAME_FORMAT"
    assert "3~30자" in response_data["detail"]


def test_signup_username_too_long():
    ''' Username이 30자 초과일 때 실패 테스트 '''
    signup_data = {
        "username": "a" * 31,  # 31자
        "password": "validpass123"
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_USERNAME_FORMAT"
    assert "3~30자" in response_data["detail"]


def test_signup_username_exactly_3_chars():
    ''' Username이 정확히 3자일 때 성공 테스트 '''
    random_username = ''.join(random.choices(string.ascii_lowercase, k=3))
    signup_data = {
        "username": random_username,  # 랜덤 영어 3자
        "password": "validpass123"
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    
    # Clean up
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_signup_username_exactly_30_chars():
    ''' Username이 정확히 30자일 때 성공 테스트 '''
    username = f"uname_{uuid4().hex[:24]}"  # ensures <= 30 chars
    signup_data = {
        "username": username[:30],  # enforce exact length
        "password": "validpass123"
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    
    # Clean up
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_signup_password_too_short():
    ''' Password가 3자 미만일 때 실패 테스트 '''
    signup_data = {
        "username": "validuser123",
        "password": "ab"  # 2자
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_PASSWORD_FORMAT"
    assert "3~30자" in response_data["detail"]


def test_signup_password_too_long():
    ''' Password가 30자 초과일 때 실패 테스트 '''
    signup_data = {
        "username": "validuser123",
        "password": "a" * 31  # 31자
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_PASSWORD_FORMAT"
    assert "3~30자" in response_data["detail"]


def test_signup_password_exactly_3_chars():
    ''' Password가 정확히 3자일 때 성공 테스트 '''
    username = f"pwdtest_{uuid4().hex[:10]}"
    signup_data = {
        "username": username,
        "password": "abc"  # 3자
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    
    # Clean up
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_signup_password_exactly_30_chars():
    ''' Password가 정확히 30자일 때 성공 테스트 '''
    username = f"pwdtest_{uuid4().hex[:10]}"
    signup_data = {
        "username": username,
        "password": "a" * 30  # 30자
    }
    
    response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    
    assert response.status_code == 201
    response_data = response.json()
    assert "access_token" in response_data
    
    # Clean up
    headers = {"Authorization": f"Bearer {response_data['access_token']}"}
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_login_username_too_short():
    ''' 로그인 시 Username이 3자 미만일 때 실패 테스트 '''
    login_data = {
        "username": "ab",  # 2자
        "password": "validpass123"
    }
    
    response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_USERNAME_FORMAT"


def test_login_password_too_short():
    ''' 로그인 시 Password가 3자 미만일 때 실패 테스트 '''
    login_data = {
        "username": "validuser123",
        "password": "ab"  # 2자
    }
    
    response = client.post(f"{API_VERSION}/auth/login", json=login_data)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_PASSWORD_FORMAT"


def test_change_password_new_password_too_short():
    ''' 비밀번호 변경 시 새 비밀번호가 3자 미만일 때 실패 테스트 '''
    username = f"chgpwd{uuid4().hex[:9]}"
    original_password = "ValidPass123"
    
    # 계정 생성
    signup_data = {
        "username": username,
        "password": original_password
    }
    signup_response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    assert signup_response.status_code == 201
    
    signup_response_data = signup_response.json()
    access_token = signup_response_data["access_token"]
    
    # 비밀번호 변경 시도 (새 비밀번호 2자)
    headers = {"Authorization": f"Bearer {access_token}"}
    change_password_data = {
        "current_password": original_password,
        "new_password": "ab"  # 2자
    }
    response = client.post(f"{API_VERSION}/auth/change-password", json=change_password_data, headers=headers)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_PASSWORD_FORMAT"
    
    # Clean up
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_change_password_new_password_too_long():
    ''' 비밀번호 변경 시 새 비밀번호가 30자 초과일 때 실패 테스트 '''
    username = f"chgpwd{uuid4().hex[:9]}"
    original_password = "ValidPass123"
    
    # 계정 생성
    signup_data = {
        "username": username,
        "password": original_password
    }
    signup_response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    assert signup_response.status_code == 201
    
    signup_response_data = signup_response.json()
    access_token = signup_response_data["access_token"]
    
    # 비밀번호 변경 시도 (새 비밀번호 31자)
    headers = {"Authorization": f"Bearer {access_token}"}
    change_password_data = {
        "current_password": original_password,
        "new_password": "a" * 31  # 31자
    }
    response = client.post(f"{API_VERSION}/auth/change-password", json=change_password_data, headers=headers)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_PASSWORD_FORMAT"
    
    # Clean up
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)


def test_change_password_current_password_too_short():
    ''' 비밀번호 변경 시 현재 비밀번호가 3자 미만일 때 실패 테스트 '''
    username = f"chgpwd{uuid4().hex[:9]}"
    original_password = "ValidPass123"
    
    # 계정 생성
    signup_data = {
        "username": username,
        "password": original_password
    }
    signup_response = client.post(f"{API_VERSION}/auth/signup", json=signup_data)
    assert signup_response.status_code == 201
    
    signup_response_data = signup_response.json()
    access_token = signup_response_data["access_token"]
    
    # 비밀번호 변경 시도 (현재 비밀번호 2자)
    headers = {"Authorization": f"Bearer {access_token}"}
    change_password_data = {
        "current_password": "ab",  # 2자
        "new_password": "ValidNewPass456"
    }
    response = client.post(f"{API_VERSION}/auth/change-password", json=change_password_data, headers=headers)
    
    assert response.status_code == 422
    response_data = response.json()
    assert response_data["custom_code"] == "INVALID_PASSWORD_FORMAT"
    
    # Clean up
    client.delete(f"{API_VERSION}/auth/delete-account", headers=headers)
