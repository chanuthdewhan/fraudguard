// Business logic for scoring a transaction.

import type { TransactionInput, PredictionResult, RiskTier } from '../types/transaction.js';
import {
  saveTransactionWithPrediction,
  findTransactionById,
  listRecentTransactions,
} from '../repositories/transaction.repository.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';

export async function scoreTransaction(input: TransactionInput) {
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    // A 502 tells "the problem is upstream, not here"
    throw new UpstreamServiceError(`ML service returned ${response.status}`);
  }

  const result = (await response.json()) as PredictionResult;
  return saveTransactionWithPrediction(input, result);
}

export async function getTransaction(id: string) {
  return findTransactionById(id);
}

export async function getRecentTransactions(riskTier?: RiskTier) {
  return listRecentTransactions(50, riskTier);
}

export class UpstreamServiceError extends Error {}

export async function simulateTransaction(input: TransactionInput): Promise<PredictionResult> {
  // Same ML service call as scoreTransaction, but deliberately does NOT
  // save anything - a what-if scenario is hypothetical, not a real
  // transaction, and shouldn't pollute the Transaction table.
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new UpstreamServiceError(`ML service returned ${response.status}`);
  }

  return (await response.json()) as PredictionResult;
}
