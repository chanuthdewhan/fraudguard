import { API_URL, USE_MOCKS } from './api';
import type { TransactionInput, PredictionResult } from '@/types';

// A very rough heuristic so the Sandbox still does something useful in
// mock mode - not meant to resemble the real model's logic, just enough
// to make the UI demonstrable without a running backend.
function mockSimulate(input: TransactionInput): PredictionResult {
  const isDraining =
    input.oldBalanceOrg > 0 && input.newBalanceOrg === 0 && input.type !== 'PAYMENT';

  if (isDraining) {
    return {
      riskScore: 0.93,
      riskTier: 'high',
      explanation: {
        baseValue: -0.0646,
        topFeatures: [
          { feature: 'origDrainedToZero', value: 0.42 },
          { feature: 'errorBalanceOrig', value: 0.31 },
        ],
      },
    };
  }

  return {
    riskScore: 0.05,
    riskTier: 'low',
    explanation: { baseValue: -0.0646, topFeatures: [] },
  };
}

export async function postSimulate(input: TransactionInput): Promise<PredictionResult> {
  if (USE_MOCKS) {
    return mockSimulate(input);
  }

  const res = await fetch(`${API_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Simulation failed: ${res.status}`);
  return res.json();
}
