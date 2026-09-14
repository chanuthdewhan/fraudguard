"""Reusable feature engineering and data preprocessing pipeline for FraudGuard.

Implements the 8 feature engineering techniques specified in the blueprint:
1. Balance discrepancy flags (errorBalanceOrig, errorBalanceDest)
2. Zero-balance-after-transaction flag (isZeroBalanceOrig)
3. Log transformation (log_amount)
4. Frequency encoding (nameOrig_freq, nameDest_freq)
5. Categorical one-hot encoding (type: CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER)
6. Cyclical time encoding (step_sin, step_cos)
7. Ratio/interaction features (drain_ratio)
8. Behavioral aggregation (orig_tx_count, orig_avg_amount)
"""


import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

KNOWN_TRANSACTION_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]


class FraudFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Transforms raw transaction data into model-ready features without data leakage.
    Learns frequency distributions, account behavior baselines, and numeric medians.
    """

    def __init__(self):
        self.name_orig_freq_: dict[str, float] = {}
        self.name_dest_freq_: dict[str, float] = {}
        self.orig_history_: dict[str, tuple[int, float]] = {}  # name -> (count, total_amount)
        self.numeric_medians_: dict[str, float] = {}
        self.feature_names_out_: list[str] = []
        self.is_fitted_: bool = False

    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        data = df.copy()
        # Normalizes column name variations in PaySim
        rename_map = {}
        if "oldbalanceOrg" in data.columns and "oldbalanceOrig" not in data.columns:
            rename_map["oldbalanceOrg"] = "oldbalanceOrig"
        if rename_map:
            data = data.rename(columns=rename_map)
        return data

    def fit(self, X: pd.DataFrame, y: pd.Series | None = None) -> "FraudFeatureEngineer":
        """Fits frequency maps, historical account aggregates, and imputation medians."""
        df = self._normalize_columns(X)

        # 1. Frequency encodings
        n_rows = max(len(df), 1)
        if "nameOrig" in df.columns:
            self.name_orig_freq_ = (df["nameOrig"].value_counts() / n_rows).to_dict()
        if "nameDest" in df.columns:
            self.name_dest_freq_ = (df["nameDest"].value_counts() / n_rows).to_dict()

        # 2. Historical account behavior baseline
        if {"nameOrig", "amount"}.issubset(df.columns):
            grouped = df.groupby("nameOrig")["amount"].agg(["count", "sum"])
            self.orig_history_ = {
                idx: (int(row["count"]), float(row["sum"]))
                for idx, row in grouped.iterrows()
            }

        # 3. Numeric medians for missingness / fallback
        numeric_cols = ["amount", "oldbalanceOrig", "newbalanceOrig", "oldbalanceDest", "newbalanceDest", "step"]
        for col in numeric_cols:
            if col in df.columns:
                self.numeric_medians_[col] = float(df[col].median(skipna=True))
            else:
                self.numeric_medians_[col] = 0.0

        # Build feature names list
        self.feature_names_out_ = [
            "amount",
            "log_amount",
            "oldbalanceOrig",
            "newbalanceOrig",
            "oldbalanceDest",
            "newbalanceDest",
            "errorBalanceOrig",
            "errorBalanceDest",
            "isZeroBalanceOrig",
            "drain_ratio",
            "step_sin",
            "step_cos",
            "nameOrig_freq",
            "nameDest_freq",
            "orig_tx_count",
            "orig_avg_amount",
            # One-hot encoded transaction types
            *[f"type_{t}" for t in KNOWN_TRANSACTION_TYPES],
        ]
        self.is_fitted_ = True
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transforms input DataFrame into model feature matrix."""
        if not self.is_fitted_:
            raise ValueError("FraudFeatureEngineer must be fitted before transform.")

        df = self._normalize_columns(X)

        # Handle numeric imputation if missing values exist
        for col, median_val in self.numeric_medians_.items():
            if col in df.columns:
                df[col] = df[col].fillna(median_val)
            else:
                df[col] = median_val

        amount = df["amount"].astype(float)
        old_orig = df["oldbalanceOrig"].astype(float)
        new_orig = df["newbalanceOrig"].astype(float)
        old_dest = df["oldbalanceDest"].astype(float)
        new_dest = df["newbalanceDest"].astype(float)
        step = df["step"].astype(float)

        feats = pd.DataFrame(index=df.index)

        # Core raw numeric features
        feats["amount"] = amount
        feats["log_amount"] = np.log1p(np.maximum(amount, 0.0))
        feats["oldbalanceOrig"] = old_orig
        feats["newbalanceOrig"] = new_orig
        feats["oldbalanceDest"] = old_dest
        feats["newbalanceDest"] = new_dest

        # 1. Balance discrepancy flags
        feats["errorBalanceOrig"] = old_orig - amount - new_orig
        feats["errorBalanceDest"] = old_dest + amount - new_dest

        # 2. Zero-balance-after-transaction flag
        feats["isZeroBalanceOrig"] = (new_orig <= 1e-4).astype(int)

        # 7. Ratio / interaction features
        feats["drain_ratio"] = amount / (old_orig + 1.0)

        # 6. Cyclical time encoding (hour of day: step % 24)
        hour = (step % 24.0).to_numpy()
        feats["step_sin"] = np.sin(2.0 * np.pi * hour / 24.0)
        feats["step_cos"] = np.cos(2.0 * np.pi * hour / 24.0)

        # 4. Frequency encoding
        default_freq = 1.0 / max(len(self.name_orig_freq_), 1000)
        if "nameOrig" in df.columns:
            feats["nameOrig_freq"] = df["nameOrig"].map(self.name_orig_freq_).fillna(default_freq).astype(float)
        else:
            feats["nameOrig_freq"] = default_freq

        if "nameDest" in df.columns:
            feats["nameDest_freq"] = df["nameDest"].map(self.name_dest_freq_).fillna(default_freq).astype(float)
        else:
            feats["nameDest_freq"] = default_freq

        # 8. Behavioral aggregation (transaction count and running average amount)
        tx_counts = []
        avg_amts = []
        for _, row in df.iterrows():
            orig = str(row.get("nameOrig", ""))
            amt = float(row.get("amount", 0.0))
            if orig in self.orig_history_:
                hist_count, hist_sum = self.orig_history_[orig]
                tx_counts.append(hist_count)
                avg_amts.append(hist_sum / max(hist_count, 1))
            else:
                tx_counts.append(1)
                avg_amts.append(amt)

        feats["orig_tx_count"] = tx_counts
        feats["orig_avg_amount"] = avg_amts

        # 5. Categorical encoding (One-hot for transaction type)
        type_col = df["type"] if "type" in df.columns else pd.Series(["TRANSFER"] * len(df), index=df.index)
        for t in KNOWN_TRANSACTION_TYPES:
            feats[f"type_{t}"] = (type_col == t).astype(int)

        # Ensure consistent column order
        return feats[self.feature_names_out_]

    def get_feature_names_out(self) -> list[str]:
        return list(self.feature_names_out_)

