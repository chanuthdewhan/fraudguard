"""SHAP explainability for a single transaction using the modern API."""

import shap
import pandas as pd

from ml_service.inference import _model
from ml_service.schemas import ShapContribution, ExplanationData

_explainer = shap.TreeExplainer(_model)
TOP_N_FEATURES = 5


def explain(features: pd.DataFrame) -> ExplanationData:
    """Accepts pre-computed features and extracts SHAP base values."""
    
    # Modern SHAP API returns an Explanation object directly
    shap_explanation = _explainer(features)
    
    # Extract the single row of values and the base intercept
    row_values = shap_explanation.values[0]
    base_value = shap_explanation.base_values[0]
    feature_names = features.columns.tolist()

    contributions = sorted(
        zip(feature_names, row_values),
        key=lambda pair: abs(pair[1]),
        reverse=True,
    )[:TOP_N_FEATURES]

    top_features = [
        ShapContribution(feature=name, value=round(float(value), 4))
        for name, value in contributions
    ]

    return ExplanationData(
        baseValue=round(float(base_value), 4),
        topFeatures=top_features
    )