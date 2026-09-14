from fastapi.testclient import TestClient

from ml_service.main import app

client = TestClient(app)


def test_api_health_with_model():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["model_type"] == "XGBClassifier"


def test_api_predict_high_risk():
    payload = {
        "step": 1,
        "type": "TRANSFER",
        "amount": 250000.0,
        "nameOrig": "C1305486145",
        "oldbalanceOrg": 250000.0,
        "newbalanceOrig": 0.0,
        "nameDest": "C553264065",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "fraud_probability" in data
    assert "risk_score" in data
    assert "risk_tier" in data
    assert data["risk_tier"] in ["LOW", "MEDIUM", "HIGH"]
    assert 0 <= data["risk_score"] <= 100


def test_api_predict_low_risk():
    payload = {
        "step": 10,
        "type": "PAYMENT",
        "amount": 15.50,
        "nameOrig": "C998877665",
        "oldbalanceOrg": 5000.0,
        "newbalanceOrig": 4984.50,
        "nameDest": "M112233445",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_tier"] == "LOW"
    assert data["is_fraud"] is False


def test_api_explain():
    payload = {
        "step": 1,
        "type": "TRANSFER",
        "amount": 180000.0,
        "nameOrig": "C1234567",
        "oldbalanceOrg": 180000.0,
        "newbalanceOrig": 0.0,
        "nameDest": "C7654321",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }
    response = client.post("/explain?top_n=3", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "base_value" in data
    assert "top_risk_factors" in data
    assert "top_mitigating_factors" in data
    assert len(data["top_features"]) <= 3
    assert len(data["all_attributions"]) > 0


def test_api_simulate():
    orig = {
        "step": 5,
        "type": "PAYMENT",
        "amount": 50.0,
        "nameOrig": "C111111",
        "oldbalanceOrg": 1000.0,
        "newbalanceOrig": 950.0,
        "nameDest": "M222222",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }
    modified = {
        "step": 5,
        "type": "TRANSFER",
        "amount": 1000.0,
        "nameOrig": "C111111",
        "oldbalanceOrg": 1000.0,
        "newbalanceOrig": 0.0,
        "nameDest": "C333333",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }
    response = client.post("/simulate", json={"original": orig, "modified": modified})
    assert response.status_code == 200
    data = response.json()
    assert "original_score" in data
    assert "modified_score" in data
    assert "score_delta" in data
    assert data["modified_score"] >= data["original_score"]


def test_api_model_info():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "FraudGuard XGBoost Classifier"
    assert "features" in data
    assert len(data["features"]) > 0
    assert len(data["benchmarks"]) > 0
