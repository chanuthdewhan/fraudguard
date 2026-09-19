import type { Transaction, StatsResponse } from '@/types';

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    step: 1,
    type: 'TRANSFER',
    amount: 181.0,
    nameOrig: 'C1305486145',
    oldBalanceOrg: 181.0,
    newBalanceOrg: 0.0,
    nameDest: 'C553264065',
    oldBalanceDest: 0.0,
    newBalanceDest: 0.0,
    createdAt: '2026-09-13T08:12:00Z',
    prediction: {
      riskScore: 0.91,
      riskTier: 'high',
      explanation: {
        baseValue: -0.0646,
        topFeatures: [
          { feature: 'errorBalanceOrig', value: 0.45 },
          { feature: 'origDrainedToZero', value: 0.28 },
          { feature: 'amountToBalanceRatio', value: 0.12 },
        ],
      },
    },
  },
  {
    id: 'tx-002',
    step: 4,
    type: 'PAYMENT',
    amount: 9839.64,
    nameOrig: 'C1231006815',
    oldBalanceOrg: 170136.0,
    newBalanceOrg: 160296.36,
    nameDest: 'M1979787155',
    oldBalanceDest: 0.0,
    newBalanceDest: 0.0,
    createdAt: '2026-09-13T09:03:00Z',
    prediction: {
      riskScore: 0.06,
      riskTier: 'low',
      explanation: {
        baseValue: -0.0646,
        topFeatures: [],
      },
    },
  },
  {
    id: 'tx-003',
    step: 12,
    type: 'CASH_OUT',
    amount: 181.0,
    nameOrig: 'C840083671',
    oldBalanceOrg: 181.0,
    newBalanceOrg: 0.0,
    nameDest: 'C38997010',
    oldBalanceDest: 21182.0,
    newBalanceDest: 0.0,
    createdAt: '2026-09-13T10:47:00Z',
    prediction: {
      riskScore: 0.58,
      riskTier: 'medium',
      explanation: {
        baseValue: -0.0646,
        topFeatures: [
          { feature: 'origDrainedToZero', value: 0.31 },
          { feature: 'hourSin', value: 0.09 },
        ],
      },
    },
  },
];

export const mockStats: StatsResponse = {
  totalTransactions: 12500,
  flaggedCount: 340,
  fraudRate: 0.0272,
  riskTierBreakdown: {
    low: 11800,
    medium: 360,
    high: 340,
  },
  modelMetrics: {
    precision: 0.81,
    recall: 0.74,
    prAuc: 0.79,
  },
};
