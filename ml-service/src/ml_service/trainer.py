"""Model training, class imbalance handling, comparison, and evaluation pipeline.

Compares:
1. Logistic Regression (interpretable baseline)
2. Random Forest
3. XGBoost (production model for SHAP)

Across imbalance strategies:
- Baseline (no handling)
- Class weighting (class_weight='balanced')
- SMOTE oversampling
"""

from dataclasses import asdict, dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from ml_service.data.sampler import load_and_sample_paysim
from ml_service.preprocessing import FraudFeatureEngineer

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


@dataclass
class ModelMetrics:
    model_name: str
    imbalance_strategy: str
    pr_auc: float
    roc_auc: float
    f1: float
    precision: float
    recall: float
    confusion_matrix: list[list[int]]


class ModelPipelineTrainer:
    """Manages training, comparison, and serialization of FraudGuard ML models."""

    def __init__(self, artifacts_dir: Path | None = None):
        self.artifacts_dir = artifacts_dir or ARTIFACTS_DIR
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.preprocessor = FraudFeatureEngineer()
        self.best_model: XGBClassifier | None = None
        self.metrics_history: list[ModelMetrics] = []

    def prepare_data(
        self,
        df: pd.DataFrame,
        test_size: float = 0.2,
        random_state: int = 42,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """Fits preprocessor on train set and transforms train and test sets."""
        X = df.drop(columns=["isFraud", "isFlaggedFraud"], errors="ignore")
        y = df["isFraud"].astype(int)

        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            X, y, test_size=test_size, stratify=y, random_state=random_state
        )

        self.preprocessor.fit(X_train_raw)
        X_train = self.preprocessor.transform(X_train_raw)
        X_test = self.preprocessor.transform(X_test_raw)

        return X_train, X_test, y_train, y_test

    def evaluate_model(
        self,
        model,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        model_name: str,
        strategy: str,
    ) -> ModelMetrics:
        """Evaluates model using PR-AUC, F1, Recall, Precision, and Confusion Matrix."""
        y_prob = model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        pr_auc = float(average_precision_score(y_test, y_prob))
        roc_auc = float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 0.0
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall = float(recall_score(y_test, y_pred, zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()

        metrics = ModelMetrics(
            model_name=model_name,
            imbalance_strategy=strategy,
            pr_auc=round(pr_auc, 4),
            roc_auc=round(roc_auc, 4),
            f1=round(f1, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
            confusion_matrix=cm,
        )
        self.metrics_history.append(metrics)
        return metrics

    def run_benchmark(
        self,
        X_train: pd.DataFrame,
        X_test: pd.DataFrame,
        y_train: pd.Series,
        y_test: pd.Series,
    ) -> list[ModelMetrics]:
        """
        Runs model comparisons per blueprint:
        1. Logistic Regression (baseline, no imbalance handling)
        2. Logistic Regression (class_weight='balanced')
        3. Random Forest (balanced)
        4. XGBoost (with scale_pos_weight / SMOTE)
        """
        results = []

        # 1. Baseline Logistic Regression (no imbalance handling)
        lr_baseline = LogisticRegression(max_iter=1000, random_state=42)
        lr_baseline.fit(X_train, y_train)
        results.append(self.evaluate_model(lr_baseline, X_test, y_test, "Logistic Regression", "None (Baseline)"))

        # 2. Logistic Regression with class_weight='balanced'
        lr_balanced = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
        lr_balanced.fit(X_train, y_train)
        results.append(self.evaluate_model(lr_balanced, X_test, y_test, "Logistic Regression", "Class Weight"))

        # 3. Random Forest (balanced)
        rf = RandomForestClassifier(n_estimators=50, class_weight="balanced", random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        results.append(self.evaluate_model(rf, X_test, y_test, "Random Forest", "Class Weight"))

        # 4. SMOTE + XGBoost
        ratio = max(1.0, (len(y_train) - y_train.sum()) / max(y_train.sum(), 1))
        xgb = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            scale_pos_weight=ratio,
            random_state=42,
            eval_metric="logloss",
        )
        xgb.fit(X_train, y_train)
        results.append(self.evaluate_model(xgb, X_test, y_test, "XGBoost", "Scale Pos Weight"))

        # Fit with SMOTE as comparison
        smote = SMOTE(random_state=42)
        X_res, y_res = smote.fit_resample(X_train, y_train)
        xgb_smote = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            eval_metric="logloss",
        )
        xgb_smote.fit(X_res, y_res)
        results.append(self.evaluate_model(xgb_smote, X_test, y_test, "XGBoost", "SMOTE"))

        # Set best model (XGBoost)
        self.best_model = xgb
        return results

    def save_pipeline(self, model_name: str = "fraudguard_model.joblib") -> dict[str, str]:
        """Saves fitted preprocessor, best model, and training metrics."""
        if self.best_model is None or not self.preprocessor.is_fitted_:
            raise ValueError("Pipeline must be trained before saving.")

        model_path = self.artifacts_dir / model_name
        preprocessor_path = self.artifacts_dir / "preprocessor.joblib"
        metrics_path = self.artifacts_dir / "benchmark_metrics.json"

        bundle = {
            "model": self.best_model,
            "feature_names": self.preprocessor.get_feature_names_out(),
        }
        joblib.dump(bundle, model_path)
        joblib.dump(self.preprocessor, preprocessor_path)

        # Save metrics
        metrics_df = pd.DataFrame([asdict(m) for m in self.metrics_history])
        metrics_df.to_json(metrics_path, orient="records", indent=2)

        return {
            "model_path": str(model_path),
            "preprocessor_path": str(preprocessor_path),
            "metrics_path": str(metrics_path),
        }


def train_and_save_fraudguard(raw_path: Path | None = None) -> dict[str, str]:
    """Top-level convenience function to train and save the full pipeline."""
    df = load_and_sample_paysim(raw_path=raw_path)
    trainer = ModelPipelineTrainer()
    X_train, X_test, y_train, y_test = trainer.prepare_data(df)
    trainer.run_benchmark(X_train, X_test, y_train, y_test)
    return trainer.save_pipeline()


if __name__ == "__main__":
    train_and_save_fraudguard()

