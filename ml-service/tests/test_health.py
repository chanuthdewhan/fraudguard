from fastapi.testclient import TestClient

from ml_service.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "fraudguard-ml-service"
    assert "version" in data

