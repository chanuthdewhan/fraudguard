import numpy as np
import pandas as pd

from ml_service.data.sampler import generate_synthetic_paysim
from ml_service.preprocessing import FraudFeatureEngineer


def test_synthetic_paysim_generation():
    df = generate_synthetic_paysim(n_samples=500, fraud_ratio=0.04, random_state=42)
    assert len(df) == 500
    assert "isFraud" in df.columns
    assert "oldbalanceOrg" in df.columns
    assert df["isFraud"].sum() > 0


def test_feature_engineering_all_8_techniques():
    df = generate_synthetic_paysim(n_samples=200, fraud_ratio=0.05, random_state=42)
    engineer = FraudFeatureEngineer()
    engineer.fit(df)
    features = engineer.transform(df)

    expected_cols = [
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
        "type_CASH_IN",
        "type_CASH_OUT",
        "type_DEBIT",
        "type_PAYMENT",
        "type_TRANSFER",
    ]

    for col in expected_cols:
        assert col in features.columns, f"Missing feature: {col}"

    # Verify error balance calculation
    first_row = df.iloc[0]
    expected_err_orig = first_row["oldbalanceOrg"] - first_row["amount"] - first_row["newbalanceOrig"]
    assert np.isclose(features.iloc[0]["errorBalanceOrig"], expected_err_orig)

    # Verify zero balance flag
    assert set(features["isZeroBalanceOrig"].unique()).issubset({0, 1})

    # Verify cyclical bounds
    assert features["step_sin"].between(-1.0, 1.0).all()
    assert features["step_cos"].between(-1.0, 1.0).all()


def test_single_row_inference_transformation():
    train_df = generate_synthetic_paysim(n_samples=100, random_state=42)
    engineer = FraudFeatureEngineer()
    engineer.fit(train_df)

    single_tx = pd.DataFrame([{
        "step": 12,
        "type": "TRANSFER",
        "amount": 50000.0,
        "nameOrig": "C1234567",
        "oldbalanceOrg": 50000.0,
        "newbalanceOrig": 0.0,
        "nameDest": "C9876543",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
    }])

    feat_matrix = engineer.transform(single_tx)
    assert feat_matrix.shape == (1, len(engineer.get_feature_names_out()))
    assert feat_matrix.iloc[0]["isZeroBalanceOrig"] == 1
    assert feat_matrix.iloc[0]["type_TRANSFER"] == 1
    assert feat_matrix.iloc[0]["type_PAYMENT"] == 0

