export interface TransactionFeaturePayload {
  step: number;
  type: 'CASH_IN' | 'CASH_OUT' | 'DEBIT' | 'PAYMENT' | 'TRANSFER';
  amount: number;
  nameOrig: string;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  nameDest: string;
  oldbalanceDest: number;
  newbalanceDest: number;
}

export interface PredictionResult {
  fraud_probability: number;
  is_fraud: boolean;
  risk_score: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  threshold: number;
}

export interface FeatureAttribution {
  feature: string;
  shap_value: number;
  feature_value: number | string;
}

export interface ExplanationResult {
  prediction: PredictionResult;
  base_value: number;
  top_risk_factors: FeatureAttribution[];
  top_mitigating_factors: FeatureAttribution[];
  top_features: FeatureAttribution[];
  all_attributions: FeatureAttribution[];
}

export interface SimulationResult {
  original_score: number;
  modified_score: number;
  score_delta: number;
  original_probability: number;
  modified_probability: number;
  original_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  modified_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  original_prediction: PredictionResult;
  modified_prediction: PredictionResult;
  original_explanation: ExplanationResult;
  modified_explanation: ExplanationResult;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export class MLServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async checkHealth(): Promise<{ status: string; service: string; model_loaded: boolean }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`ML Service health check failed: ${res.statusText}`);
    return res.json();
  }

  async predict(payload: TransactionFeaturePayload, threshold = 0.5): Promise<PredictionResult> {
    const res = await fetch(`${this.baseUrl}/predict?threshold=${threshold}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`ML predict failed: ${await res.text()}`);
    return res.json();
  }

  async explain(payload: TransactionFeaturePayload, topN = 5): Promise<ExplanationResult> {
    const res = await fetch(`${this.baseUrl}/explain?top_n=${topN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`ML explain failed: ${await res.text()}`);
    return res.json();
  }

  async simulate(
    original: TransactionFeaturePayload,
    modified: TransactionFeaturePayload,
  ): Promise<SimulationResult> {
    const res = await fetch(`${this.baseUrl}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original, modified }),
    });
    if (!res.ok) throw new Error(`ML simulate failed: ${await res.text()}`);
    return res.json();
  }

  async getModelInfo(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/model-info`);
    if (!res.ok) throw new Error(`ML getModelInfo failed: ${await res.text()}`);
    return res.json();
  }
}

export const mlClient = new MLServiceClient();
