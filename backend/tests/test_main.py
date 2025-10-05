from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


def test_read_users():
    response = client.get("/api/v1/user/")
    assert response.status_code == 200
    assert response.json() == []