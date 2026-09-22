export type TransactionType = 'CASH_IN' | 'CASH_OUT' | 'DEBIT' | 'PAYMENT' | 'TRANSFER';
export type RiskTier = 'low' | 'medium' | 'high';

export interface TransactionInput {
  step: number;
  type: TransactionType;
  amount: number;
  nameOrig: string;
  oldBalanceOrg: number;
  newBalanceOrg: number;
  nameDest: string;
  oldBalanceDest: number;
  newBalanceDest: number;
}

export interface ShapContribution {
  feature: string;
  value: number;
}

export interface Explanation {
  baseValue: number;
  topFeatures: ShapContribution[];
}

export interface PredictionResult {
  riskScore: number;
  riskTier: RiskTier;
  explanation: Explanation;
}

export interface StatsResponse {
  totalTransactions: number;
  flaggedCount: number;
  fraudRate: number;
  riskTierBreakdown: Record<RiskTier, number>;
  modelMetrics: {
    precision: number;
    recall: number;
    prAuc: number;
  };
}
