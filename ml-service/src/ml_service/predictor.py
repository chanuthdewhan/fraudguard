"""Inference engine managing model lifecycle, scoring, and SHAP explanations."""

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from ml_service.explainer import FraudExplainer
from ml_service.preprocessing import FraudFeatureEngineer
from ml_service.schemas import (
    ExplanationResponse,
    FeatureAttribution,
    ModelInfoResponse,
    PredictionResponse,
    SimulationResponse,
    TransactionInput,
)

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


class FraudPredictor:
    """Manages loaded XGBoost model and preprocessor for low-latency inference."""

    def __init__(self, artifacts_dir: Path | None = None):
        self.artifacts_dir = artifacts_dir or ARTIFACTS_DIR
        self.model: Any = None
        self.feature_names: list[str] = []
        self.preprocessor: FraudFeatureEngineer | None = None
        self.explainer: FraudExplainer | None = None
        self.benchmarks: list[dict[str, Any]] = []
        self.load_artifacts()

    def load_artifacts(self) -> None:
        """Loads trained model, preprocessor, and metrics from artifacts directory."""
        model_path = self.artifacts_dir / "fraudguard_model.joblib"
        preprocessor_path = self.artifacts_dir / "preprocessor.joblib"
        metrics_path = self.artifacts_dir / "benchmark_metrics.json"

        if model_path.is_file() and preprocessor_path.is_file():
            bundle = joblib.load(model_path)
            self.model = bundle["model"]
            self.feature_names = bundle["feature_names"]
            self.preprocessor = joblib.load(preprocessor_path)
            self.explainer = FraudExplainer(self.model, self.feature_names)

        if metrics_path.is_file():
            with open(metrics_path, "r", encoding="utf-8") as f:
                self.benchmarks = json.load(f)

    @property
    def is_loaded(self) -> bool:
        return self.model is not None and self.preprocessor is not None

    def _determine_tier(self, probability: float) -> str:
        if probability >= 0.70:
            return "HIGH"
        if probability >= 0.30:
            return "MEDIUM"
        return "LOW"

    def predict_one(self, tx: TransactionInput, threshold: float = 0.5) -> PredictionResponse:
        """Scores a single raw transaction."""
        if not self.is_loaded:
            raise RuntimeError("Model artifacts are not loaded.")

        df_raw = pd.DataFrame([tx.model_dump()])
        features_df = self.preprocessor.transform(df_raw)
        prob = float(self.model.predict_proba(features_df)[0, 1])
        risk_score = round(prob * 100)
        tier = self._determine_tier(prob)

        return PredictionResponse(
            fraud_probability=round(prob, 4),
            is_fraud=bool(prob >= threshold),
            risk_score=risk_score,
            risk_tier=tier,
            threshold=threshold,
        )

    def explain_one(self, tx: TransactionInput, top_n: int = 5) -> ExplanationResponse:
        """Generates prediction along with SHAP waterfall explanations."""
        if not self.is_loaded or self.explainer is None:
            raise RuntimeError("Model or explainer artifacts are not loaded.")

        pred = self.predict_one(tx)
        df_raw = pd.DataFrame([tx.model_dump()])
        features_df = self.preprocessor.transform(df_raw)
        explanation_dict = self.explainer.explain_instance(features_df, top_n=top_n)

        return ExplanationResponse(
            prediction=pred,
            base_value=explanation_dict["base_value"],
            top_risk_factors=[FeatureAttribution(**item) for item in explanation_dict["top_risk_factors"]],
            top_mitigating_factors=[FeatureAttribution(**item) for item in explanation_dict["top_mitigating_factors"]],
            top_features=[FeatureAttribution(**item) for item in explanation_dict["top_features"]],
            all_attributions=[FeatureAttribution(**item) for item in explanation_dict["all_attributions"]],
        )

    def simulate(self, orig: TransactionInput, modified: TransactionInput) -> SimulationResponse:
        """Compares baseline transaction against modified what-if inputs."""
        orig_exp = self.explain_one(orig)
        mod_exp = self.explain_one(modified)

        score_delta = mod_exp.prediction.risk_score - orig_exp.prediction.risk_score

        return SimulationResponse(
            original_score=orig_exp.prediction.risk_score,
            modified_score=mod_exp.prediction.risk_score,
            score_delta=score_delta,
            original_probability=orig_exp.prediction.fraud_probability,
            modified_probability=mod_exp.prediction.fraud_probability,
            original_tier=orig_exp.prediction.risk_tier,
            modified_tier=mod_exp.prediction.risk_tier,
            original_prediction=orig_exp.prediction,
            modified_prediction=mod_exp.prediction,
            original_explanation=orig_exp,
            modified_explanation=mod_exp,
        )

    def get_info(self) -> ModelInfoResponse:
        """Returns model metadata and benchmark metrics."""
        return ModelInfoResponse(
            model_name="FraudGuard XGBoost Classifier",
            model_type="XGBClassifier",
            features=self.feature_names,
            benchmarks=self.benchmarks,
        )
