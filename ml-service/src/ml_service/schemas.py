"""Pydantic schemas for FraudGuard ML Service API."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    """Raw transaction payload conforming to PaySim specifications."""
    step: int = Field(..., description="Hour step in simulation (1-744)", ge=1, examples=[1])
    type: Literal["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"] = Field(
        ..., description="Transaction type", examples=["TRANSFER"]
    )
    amount: float = Field(..., description="Amount transferred in USD", ge=0.0, examples=[181.0])
    nameOrig: str = Field(..., description="Origin customer identifier", examples=["C1305486145"])
    oldbalanceOrg: float = Field(..., description="Origin balance before transaction", ge=0.0, examples=[181.0])
    newbalanceOrig: float = Field(..., description="Origin balance after transaction", ge=0.0, examples=[0.0])
    nameDest: str = Field(..., description="Destination recipient identifier", examples=["C553264065"])
    oldbalanceDest: float = Field(..., description="Destination balance before transaction", ge=0.0, examples=[0.0])
    newbalanceDest: float = Field(..., description="Destination balance after transaction", ge=0.0, examples=[0.0])


class PredictionResponse(BaseModel):
    """Scored transaction response with probability and risk tier."""
    fraud_probability: float = Field(..., description="Probability of fraud between 0.0 and 1.0", ge=0.0, le=1.0)
    is_fraud: bool = Field(..., description="Flag indicating if fraud probability exceeds decision threshold")
    risk_score: int = Field(..., description="Normalized integer risk score from 0 to 100", ge=0, le=100)
    risk_tier: Literal["LOW", "MEDIUM", "HIGH"] = Field(..., description="Risk tier based on threshold rules")
    threshold: float = Field(..., description="Decision threshold applied (default 0.5)")


class FeatureAttribution(BaseModel):
    """Individual feature contribution under TreeSHAP."""
    feature: str = Field(..., description="Name of the engineered feature")
    shap_value: float = Field(..., description="SHAP attribution value (log-odds impact)")
    feature_value: Any = Field(..., description="Value of the feature for this transaction")


class ExplanationResponse(BaseModel):
    """SHAP explanation breakdown for a scored transaction."""
    prediction: PredictionResponse
    base_value: float = Field(..., description="Expected baseline log-odds value")
    top_risk_factors: list[FeatureAttribution] = Field(
        ..., description="Features that most heavily pushed score towards fraud"
    )
    top_mitigating_factors: list[FeatureAttribution] = Field(
        ..., description="Features that most heavily decreased fraud risk"
    )
    top_features: list[FeatureAttribution] = Field(
        ..., description="Top features sorted by absolute attribution magnitude"
    )
    all_attributions: list[FeatureAttribution] = Field(
        ..., description="Full list of all feature attributions"
    )


class SimulationInput(BaseModel):
    """What-if simulation input comparing original vs modified transaction."""
    original: TransactionInput
    modified: TransactionInput


class SimulationResponse(BaseModel):
    """Comparison result of what-if scenario."""
    original_score: int
    modified_score: int
    score_delta: int
    original_probability: float
    modified_probability: float
    original_tier: Literal["LOW", "MEDIUM", "HIGH"]
    modified_tier: Literal["LOW", "MEDIUM", "HIGH"]
    original_prediction: PredictionResponse
    modified_prediction: PredictionResponse
    original_explanation: ExplanationResponse
    modified_explanation: ExplanationResponse


class ModelInfoResponse(BaseModel):
    """Model metadata, features, and evaluation benchmarks."""
    model_name: str
    model_type: str
    features: list[str]
    benchmarks: list[dict[str, Any]]
