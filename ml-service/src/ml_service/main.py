from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from ml_service.predictor import FraudPredictor
from ml_service.schemas import (
    ExplanationResponse,
    ModelInfoResponse,
    PredictionResponse,
    SimulationInput,
    SimulationResponse,
    TransactionInput,
)

app = FastAPI(
    title="FraudGuard ML Service",
    description="Real-time transaction fraud scoring and SHAP explainability service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = FraudPredictor()


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "fraudguard-ml-service",
        "version": "0.1.0",
        "model_loaded": predictor.is_loaded,
        "model_type": "XGBClassifier" if predictor.is_loaded else None,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(tx: TransactionInput, threshold: float = Query(0.5, ge=0.0, le=1.0)):
    """Predicts fraud risk for a single transaction."""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded. Train or deploy model artifacts.")
    return predictor.predict_one(tx, threshold=threshold)


@app.post("/explain", response_model=ExplanationResponse)
def explain(tx: TransactionInput, top_n: int = Query(5, ge=1, le=20)):
    """Returns prediction along with SHAP waterfall explanations."""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded. Train or deploy model artifacts.")
    return predictor.explain_one(tx, top_n=top_n)


@app.post("/simulate", response_model=SimulationResponse)
def simulate(scenario: SimulationInput):
    """Simulates what-if modifications to transaction attributes."""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded. Train or deploy model artifacts.")
    return predictor.simulate(scenario.original, scenario.modified)


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    """Returns model metadata, features, and benchmark metrics."""
    return predictor.get_info()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("ml_service.main:app", host="0.0.0.0", port=8000, reload=True)