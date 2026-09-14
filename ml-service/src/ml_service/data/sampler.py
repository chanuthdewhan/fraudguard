"""PaySim dataset loading, sampling, and synthetic benchmark generation."""

from pathlib import Path

import numpy as np
import pandas as pd

RAW_DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "raw" / "PS_20174392719_1491204439457_log.csv"
PROCESSED_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"


def generate_synthetic_paysim(n_samples: int = 25000, fraud_ratio: float = 0.03, random_state: int = 42) -> pd.DataFrame:
    """
    Generate a high-fidelity synthetic PaySim dataset adhering to PaySim schema
    and fraud patterns (transfer drains, balance discrepancy, cash_out patterns).
    Used for instant testing and local development when full 500MB PaySim is absent.
    """
    rng = np.random.default_rng(random_state)
    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    # Legitimate transactions
    legit_types = rng.choice(
        ["PAYMENT", "CASH_OUT", "CASH_IN", "TRANSFER", "DEBIT"],
        size=n_legit,
        p=[0.35, 0.35, 0.20, 0.08, 0.02],
    )
    legit_steps = rng.integers(1, 744, size=n_legit)  # 31 days in hours
    legit_amounts = rng.lognormal(mean=7.5, sigma=1.2, size=n_legit).round(2)
    legit_old_orig = rng.lognormal(mean=8.0, sigma=1.5, size=n_legit).round(2)

    legit_new_orig = np.zeros(n_legit)
    for i in range(n_legit):
        t = legit_types[i]
        amt = legit_amounts[i]
        old_o = legit_old_orig[i]
        if t in ["PAYMENT", "CASH_OUT", "TRANSFER", "DEBIT"]:
            legit_new_orig[i] = max(0.0, round(old_o - amt, 2))
        else:  # CASH_IN
            legit_new_orig[i] = round(old_o + amt, 2)

    legit_old_dest = rng.lognormal(mean=8.2, sigma=1.8, size=n_legit).round(2)
    legit_new_dest = np.zeros(n_legit)
    for i in range(n_legit):
        t = legit_types[i]
        amt = legit_amounts[i]
        old_d = legit_old_dest[i]
        if t in ["CASH_OUT", "TRANSFER"]:
            legit_new_dest[i] = round(old_d + amt, 2)
        elif t == "CASH_IN":
            legit_new_dest[i] = max(0.0, round(old_d - amt, 2))
        else:
            legit_new_dest[i] = old_d

    legit_df = pd.DataFrame({
        "step": legit_steps,
        "type": legit_types,
        "amount": legit_amounts,
        "nameOrig": [f"C{rng.integers(1000000, 9999999)}" for _ in range(n_legit)],
        "oldbalanceOrg": legit_old_orig,
        "newbalanceOrig": legit_new_orig,
        "nameDest": [
            f"M{rng.integers(1000000, 9999999)}" if legit_types[i] == "PAYMENT"
            else f"C{rng.integers(1000000, 9999999)}"
            for i in range(n_legit)
        ],
        "oldbalanceDest": legit_old_dest,
        "newbalanceDest": legit_new_dest,
        "isFraud": np.zeros(n_legit, dtype=int),
        "isFlaggedFraud": np.zeros(n_legit, dtype=int),
    })

    # Fraudulent transactions: in PaySim, fraud occurs ONLY on TRANSFER and CASH_OUT
    fraud_types = rng.choice(["TRANSFER", "CASH_OUT"], size=n_fraud, p=[0.5, 0.5])
    fraud_steps = rng.integers(1, 744, size=n_fraud)
    # Fraud transactions typically drain the entire balance or large amounts
    fraud_amounts = rng.lognormal(mean=11.0, sigma=1.5, size=n_fraud).round(2)
    fraud_old_orig = fraud_amounts.copy()  # drained entirely
    fraud_new_orig = np.zeros(n_fraud)  # drops to 0

    # Destination often has 0 balance initially and fraud leaves discrepancy
    fraud_old_dest = np.zeros(n_fraud)
    fraud_new_dest = np.zeros(n_fraud)  # discrepancy: money disappeared or cashed out

    fraud_df = pd.DataFrame({
        "step": fraud_steps,
        "type": fraud_types,
        "amount": fraud_amounts,
        "nameOrig": [f"C{rng.integers(1000000, 9999999)}" for _ in range(n_fraud)],
        "oldbalanceOrg": fraud_old_orig,
        "newbalanceOrig": fraud_new_orig,
        "nameDest": [f"C{rng.integers(1000000, 9999999)}" for _ in range(n_fraud)],
        "oldbalanceDest": fraud_old_dest,
        "newbalanceDest": fraud_new_dest,
        "isFraud": np.ones(n_fraud, dtype=int),
        "isFlaggedFraud": (fraud_amounts > 200000).astype(int),
    })

    combined = pd.concat([legit_df, fraud_df], ignore_index=True)
    return combined.sample(frac=1.0, random_state=random_state).reset_index(drop=True)


def load_and_sample_paysim(
    raw_path: Path | None = None,
    n_non_fraud: int = 200000,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Loads raw PaySim dataset and applies the blueprint downsampling strategy:
    Take ALL fraud cases (~8,213 rows) + random sample of n_non_fraud rows.
    Falls back to high-fidelity synthetic benchmark if raw PaySim CSV is not present.
    """
    path = raw_path or RAW_DATA_PATH
    if path.is_file():
        print(f"Loading raw PaySim data from {path}...")
        df = pd.read_csv(path)
        fraud_df = df[df["isFraud"] == 1]
        non_fraud_df = df[df["isFraud"] == 0]

        sample_size = min(len(non_fraud_df), n_non_fraud)
        non_fraud_sample = non_fraud_df.sample(n=sample_size, random_state=random_state)

        sampled = pd.concat([fraud_df, non_fraud_sample], ignore_index=True)
        sampled = sampled.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
        print(f"Sampled dataset: {len(sampled)} rows ({len(fraud_df)} fraud, {sample_size} non-fraud).")
        return sampled

    print(f"Raw PaySim dataset not found at {path}. Generating synthetic PaySim benchmark...")
    return generate_synthetic_paysim(n_samples=25000, fraud_ratio=0.03, random_state=random_state)

