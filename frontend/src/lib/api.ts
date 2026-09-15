export interface Transaction {
  id: string;
  step: number;
  type: 'CASH_IN' | 'CASH_OUT' | 'DEBIT' | 'PAYMENT' | 'TRANSFER';
  amount: number;
  nameOrig: string;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  nameDest: string;
  oldbalanceDest: number;
  newbalanceDest: number;
  riskScore: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  isFraud: boolean;
  fraudProbability: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  explanation?: {
    base_value: number;
    prediction: {
      risk_score: number;
      risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
      fraud_probability: number;
      is_fraud: boolean;
    };
    top_risk_factors: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
    top_mitigating_factors: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
    top_features: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
    all_attributions: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
  };
  analystNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalTransactions: number;
  flaggedCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  escalatedCount: number;
  fraudRate: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  statusDistribution: {
    pending: number;
    approved: number;
    rejected: number;
    escalated: number;
  };
}

export interface SimulationResponse {
  original_score: number;
  modified_score: number;
  score_delta: number;
  original_probability: number;
  modified_probability: number;
  original_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  modified_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  original_prediction: {
    risk_score: number;
    risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
    fraud_probability: number;
    is_fraud: boolean;
  };
  modified_prediction: {
    risk_score: number;
    risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
    fraud_probability: number;
    is_fraud: boolean;
  };
  original_explanation: {
    base_value: number;
    top_risk_factors: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
  };
  modified_explanation: {
    base_value: number;
    top_risk_factors: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
    top_mitigating_factors: Array<{ feature: string; shap_value: number; feature_value: string | number }>;
  };
}

export interface ModelBenchmark {
  model_name: string;
  imbalance_strategy: string;
  pr_auc: number;
  roc_auc: number;
  f1: number;
  precision: number;
  recall: number;
  confusion_matrix: number[][];
}

export interface ModelInfoData {
  model_name: string;
  model_type: string;
  features: string[];
  benchmarks: ModelBenchmark[];
}

const API_BASE = '/api';

export async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function getTransactions(params?: {
  riskTier?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.riskTier && params.riskTier !== 'ALL') searchParams.set('riskTier', params.riskTier);
  if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/transactions?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  return res.json();
}

export async function updateTransactionStatus(
  id: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED',
  analystNotes?: string,
): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, analystNotes }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function simulateScenario(
  original: unknown,
  modified: unknown,
): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original, modified }),
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function getModelInfo(): Promise<ModelInfoData> {
  const res = await fetch(`${API_BASE}/model-info`);
  if (!res.ok) throw new Error('Failed to fetch model info');
  return res.json();
}

