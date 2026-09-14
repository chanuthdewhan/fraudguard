"""SHAP explainability engine for FraudGuard predictions.

Wraps shap.TreeExplainer to produce per-transaction feature attributions
(waterfall-ready components, top risk-increasing and risk-decreasing factors).
"""

from typing import Any

import numpy as np
import pandas as pd
import shap


class FraudExplainer:
    """Computes TreeSHAP explanations for tree-based fraud models."""

    def __init__(self, model: Any, feature_names: list[str]):
        self.model = model
        self.feature_names = feature_names
        self.explainer = shap.TreeExplainer(model)
        # TreeExplainer expected_value can be scalar or array
        expected_val = self.explainer.expected_value
        if isinstance(expected_val, (list, np.ndarray)):
            self.base_value = float(expected_val[-1])
        else:
            self.base_value = float(expected_val)

    def explain_instance(
        self,
        features_df: pd.DataFrame,
        top_n: int = 5,
    ) -> dict[str, Any]:
        """
        Computes SHAP values for a single transaction feature row.
        Returns top risk-increasing (positive SHAP) and risk-decreasing (negative SHAP) features.
        """
        if isinstance(features_df, pd.Series):
            features_df = features_df.to_frame().T

        shap_values = self.explainer.shap_values(features_df)

        # Handle different SHAP output shapes
        if isinstance(shap_values, list):
            row_shap = shap_values[-1][0]  # Positive class (fraud)
        elif len(shap_values.shape) == 2:
            row_shap = shap_values[0]
        elif len(shap_values.shape) == 3:
            row_shap = shap_values[0, :, 1]
        else:
            row_shap = np.array(shap_values).flatten()

        feature_row = features_df.iloc[0]

        attributions = []
        for name, shap_val in zip(self.feature_names, row_shap, strict=False):
            attributions.append({
                "feature": name,
                "shap_value": round(float(shap_val), 4),
                "feature_value": round(float(feature_row[name]), 4)
                if isinstance(feature_row[name], (int, float, np.number))
                else str(feature_row[name]),
            })

        # Separate risk-increasing (positive SHAP push toward fraud) and risk-decreasing
        positive_factors = [a for a in attributions if a["shap_value"] > 0]
        negative_factors = [a for a in attributions if a["shap_value"] < 0]

        positive_factors.sort(key=lambda x: x["shap_value"], reverse=True)
        negative_factors.sort(key=lambda x: x["shap_value"])  # Most negative first

        # Top N features overall by absolute magnitude
        all_sorted = sorted(attributions, key=lambda x: abs(x["shap_value"]), reverse=True)

        return {
            "base_value": round(self.base_value, 4),
            "top_risk_factors": positive_factors[:top_n],
            "top_mitigating_factors": negative_factors[:top_n],
            "top_features": all_sorted[:top_n],
            "all_attributions": attributions,
        }

