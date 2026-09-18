import {
  countTransactions,
  countByRiskTier,
  countFlagged,
} from '../repositories/transaction.repository.js';
import type { StatsResponse } from '../types/transaction.js';

// TODO: replace with real numbers once the ml-service exposes its own
// evaluation metrics.
const PLACEHOLDER_MODEL_METRICS = {
  precision: 0.81,
  recall: 0.74,
  prAuc: 0.79,
};

export async function getStats(): Promise<StatsResponse> {
  const [total, riskTierBreakdown, flaggedCount] = await Promise.all([
    countTransactions(),
    countByRiskTier(),
    countFlagged(),
  ]);

  return {
    totalTransactions: total,
    flaggedCount,
    fraudRate: total > 0 ? flaggedCount / total : 0,
    riskTierBreakdown,
    modelMetrics: PLACEHOLDER_MODEL_METRICS,
  };
}
