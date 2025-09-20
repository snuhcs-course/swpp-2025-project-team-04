
from backend.tests.test_main import client

DUMMY_USER_USERNAME="test_login_target"
DUMMY_USER_PASSWORD= "test_login_target" # 이 계정은 DB에 있다고 가정(삭제 x)

def test_login_success():
    ''' valid input에 대한 success test '''
    login_data = {
        "username": DUMMY_USER_USERNAME,
        "password": DUMMY_USER_PASSWORD
    } 

    response = client.post("/api/v1/auth/login", json=login_data)
    
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
    response = client.post("/api/v1/auth/login", json=login_data)
    
    assert response.status_code == 401
    response_data = response.json()
    assert response_data["detail"] == "Invalid username or password"