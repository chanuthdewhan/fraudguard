from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml_service.schemas import TransactionInput, PredictionResult, ExplanationData
from ml_service.inference import predict, build_feature_row
from ml_service.explain import explain

app = FastAPI(title="FraudGuard ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResult)
def predict_endpoint(transaction: TransactionInput) -> PredictionResult:
    """Scores a transaction and calculates explanations using a single feature pass."""
    
    # Build the Pandas DataFrame exactly once per request
    features = build_feature_row(transaction)
    
    # Pass the computed dataframe to both functions
    pred_data = predict(features)
    explanation_data = explain(features)

    return PredictionResult(
        riskScore=pred_data["riskScore"],
        riskTier=pred_data["riskTier"],
        explanation=explanation_data
    )


@app.post("/explain", response_model=ExplanationData)
def explain_endpoint(transaction: TransactionInput) -> ExplanationData:
    """Returns the SHAP explanation alongside the required waterfall base value."""
    features = build_feature_row(transaction)
    return explain(features)