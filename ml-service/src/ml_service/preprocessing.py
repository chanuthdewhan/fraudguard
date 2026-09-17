"""
FraudGuard Feature Engineering Pipeline.

Shared module to avoid training-serving skew. 
Imported by both the Jupyter training notebook and the FastAPI inference service 
to ensure the model gets identical feature transformations in production.
"""

import numpy as np
import pandas as pd

RAW_COLUMN_RENAME = {
    "oldbalanceOrg": "oldBalanceOrg",
    "newbalanceOrig": "newBalanceOrg",
    "oldbalanceDest": "oldBalanceDest",
    "newbalanceDest": "newBalanceDest",
}

def load_and_rename(path: str) -> pd.DataFrame:
    """Loads raw PaySim data and fixes casing to match the TS backend."""
    df = pd.read_csv(path)
    return df.rename(columns=RAW_COLUMN_RENAME)


def add_balance_discrepancy_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates ledger mismatches. 
    EDA showed that perfect math (0 error) is a strong indicator of PaySim's fraud bots.
    """
    df["errorBalanceOrig"] = df["oldBalanceOrg"] - df["amount"] - df["newBalanceOrg"]
    df["errorBalanceDest"] = df["oldBalanceDest"] + df["amount"] - df["newBalanceDest"]
    return df


def add_zero_balance_flag(df: pd.DataFrame) -> pd.DataFrame:
    """Flags classic account-draining behavior."""
    df["origDrainedToZero"] = ((df["newBalanceOrg"] == 0) & (df["oldBalanceOrg"] > 0)).astype(int)
    return df


def add_log_amount(df: pd.DataFrame) -> pd.DataFrame:
    """Applies log1p to amount to tame the extreme right-skew."""
    df["logAmount"] = np.log1p(df["amount"])
    return df


def add_amount_to_balance_ratio(df: pd.DataFrame) -> pd.DataFrame:
    """% of account balance moved. +1 prevents division by zero."""
    df["amountToBalanceRatio"] = df["amount"] / (df["oldBalanceOrg"] + 1)
    return df


def add_cyclical_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms linear 'step' (hours) into 24h cyclical sin/cos features 
    so the model knows 23:00 and 00:00 are consecutive.
    """
    hour_of_day = df["step"] % 24
    df["hourSin"] = np.sin(2 * np.pi * hour_of_day / 24)
    df["hourCos"] = np.cos(2 * np.pi * hour_of_day / 24)
    return df


def add_type_dummies(df: pd.DataFrame) -> pd.DataFrame:
    """
    Manual one-hot encoding for transaction type.
    We don't use pd.get_dummies() here because a live API request might only 
    have one type, which would crash the model due to missing columns.
    """
    expected_types = ['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER']
    for t in expected_types:
        df[f'type_{t}'] = (df['type'] == t).astype(int)
    return df


def add_account_frequency(df: pd.DataFrame) -> pd.DataFrame:
    """
    Frequency encoding for accounts. Burner accounts usually have count=1.
    Note: Dynamic calculation for MVP. In prod, we'd map to a stored dictionary.
    """
    df["origFrequency"] = df.groupby("nameOrig")["nameOrig"].transform("count")
    df["destFrequency"] = df.groupby("nameDest")["nameDest"].transform("count")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Main pipeline runner. Always call this, not the individual steps."""
    df = df.copy()
    df = add_balance_discrepancy_features(df)
    df = add_zero_balance_flag(df)
    df = add_log_amount(df)
    df = add_amount_to_balance_ratio(df)
    df = add_cyclical_time_features(df)
    df = add_type_dummies(df)
    df = add_account_frequency(df)
    return df


# Columns that should never be fed to the model directly.
NON_FEATURE_COLUMNS = ["nameOrig", "nameDest", "type", "isFraud", "isFlaggedFraud", "step", "amount"]


def get_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Runs the pipeline and strips out IDs/raw targets before returning the matrix."""
    engineered = engineer_features(df)
    feature_cols = [c for c in engineered.columns if c not in NON_FEATURE_COLUMNS]
    return engineered[feature_cols]