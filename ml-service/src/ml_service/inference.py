"""Loads the trained model once at startup and evaluates features."""

import os
from pathlib import Path
import joblib
import pandas as pd

from ml_service.preprocessing import NON_FEATURE_COLUMNS, engineer_features
from ml_service.schemas import TransactionInput

MODEL_DIR = Path(__file__).parent / "models"

MODEL_PATH = MODEL_DIR / "xgboost_fraud_model.pkl"
FEATURE_COLUMNS_PATH = MODEL_DIR / "feature_columns.pkl"

# Load the model parameters
_model = joblib.load(MODEL_PATH)
_feature_columns: list[str] = joblib.load(FEATURE_COLUMNS_PATH)


def _risk_tier(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


def build_feature_row(transaction: TransactionInput) -> pd.DataFrame:
    """Runs the shared feature pipeline and strictly reorders columns."""
    df = pd.DataFrame([transaction.model_dump()])
    engineered = engineer_features(df)
    feature_cols = [c for c in engineered.columns if c not in NON_FEATURE_COLUMNS]
    return engineered[feature_cols].reindex(columns=_feature_columns, fill_value=0)


def predict(features: pd.DataFrame) -> dict:
    """Accepts pre-computed features to prevent redundant Pandas operations."""
    score = float(_model.predict_proba(features)[0][1])
    return {
        "riskScore": round(score, 4),
        "riskTier": _risk_tier(score)
    }