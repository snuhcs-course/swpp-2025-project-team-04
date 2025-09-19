from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


def test_read_users():
    response = client.get("/api/v1/users/")
    assert response.status_code == 200
    assert response.json() == []