import tempfile
from pathlib import Path

import joblib

from ml_service.data.sampler import generate_synthetic_paysim
from ml_service.explainer import FraudExplainer
from ml_service.preprocessing import FraudFeatureEngineer
from ml_service.trainer import ModelPipelineTrainer


def test_model_training_and_comparison():
    df = generate_synthetic_paysim(n_samples=400, fraud_ratio=0.1, random_state=42)

    with tempfile.TemporaryDirectory() as tmp_dir:
        trainer = ModelPipelineTrainer(artifacts_dir=Path(tmp_dir))
        X_train, X_test, y_train, y_test = trainer.prepare_data(df, test_size=0.25)

        metrics_list = trainer.run_benchmark(X_train, X_test, y_train, y_test)
        assert len(metrics_list) >= 4  # LR baseline, LR balanced, RF, XGBoost

        # Verify all metrics are present
        for m in metrics_list:
            assert m.pr_auc >= 0.0
            assert m.f1 >= 0.0
            assert len(m.confusion_matrix) == 2

        # Save pipeline and verify files
        paths = trainer.save_pipeline("test_model.joblib")
        assert Path(paths["model_path"]).exists()
        assert Path(paths["preprocessor_path"]).exists()
        assert Path(paths["metrics_path"]).exists()

        # Load back
        bundle = joblib.load(paths["model_path"])
        loaded_model = bundle["model"]
        loaded_preprocessor = joblib.load(paths["preprocessor_path"])

        assert isinstance(loaded_preprocessor, FraudFeatureEngineer)
        sample_x = X_test.iloc[[0]]
        pred_prob = loaded_model.predict_proba(sample_x)[:, 1]
        assert 0.0 <= pred_prob[0] <= 1.0


def test_shap_explainer_attribution():
    df = generate_synthetic_paysim(n_samples=300, fraud_ratio=0.1, random_state=42)
    trainer = ModelPipelineTrainer()
    X_train, X_test, y_train, y_test = trainer.prepare_data(df)
    trainer.run_benchmark(X_train, X_test, y_train, y_test)

    explainer = FraudExplainer(trainer.best_model, trainer.preprocessor.get_feature_names_out())
    explanation = explainer.explain_instance(X_test.iloc[[0]], top_n=3)

    assert "base_value" in explanation
    assert "top_risk_factors" in explanation
    assert "top_mitigating_factors" in explanation
    assert len(explanation["top_features"]) <= 3
    assert len(explanation["all_attributions"]) == len(trainer.preprocessor.get_feature_names_out())

