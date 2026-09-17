from typing import Literal
from pydantic import BaseModel, ConfigDict


class TransactionInput(BaseModel):
    # Enforces strict API contract matching the TypeScript backend
    model_config = ConfigDict(extra="forbid")
    
    step: int
    type: Literal["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]
    amount: float
    nameOrig: str
    oldBalanceOrg: float
    newBalanceOrg: float
    nameDest: str
    oldBalanceDest: float
    newBalanceDest: float


class ShapContribution(BaseModel):
    feature: str
    value: float


class ExplanationData(BaseModel):
    baseValue: float
    topFeatures: list[ShapContribution]


class PredictionResult(BaseModel):
    riskScore: float
    riskTier: Literal["low", "medium", "high"]
    explanation: ExplanationData