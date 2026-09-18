import { prisma } from '../lib/prisma.js';
import type { TransactionInput, PredictionResult, RiskTier } from '../types/transaction.js';

export async function saveTransactionWithPrediction(
  input: TransactionInput,
  result: PredictionResult,
) {
  return prisma.transaction.create({
    data: {
      step: input.step,
      type: input.type,
      amount: input.amount,
      nameOrig: input.nameOrig,
      oldBalanceOrg: input.oldBalanceOrg,
      newBalanceOrg: input.newBalanceOrg,
      nameDest: input.nameDest,
      oldBalanceDest: input.oldBalanceDest,
      newBalanceDest: input.newBalanceDest,
      prediction: {
        create: {
          riskScore: result.riskScore,
          riskTier: result.riskTier,
          explanation: result.explanation as object,
        },
      },
    },
    include: { prediction: true },
  });
}

export async function findTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: { prediction: true },
  });
}

export async function listRecentTransactions(limit = 50, riskTier?: RiskTier) {
  return prisma.transaction.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    where: riskTier ? { prediction: { riskTier } } : undefined,
    include: { prediction: true },
  });
}

export async function countTransactions() {
  return prisma.transaction.count();
}

export async function countByRiskTier() {
  const rows = await prisma.prediction.groupBy({
    by: ['riskTier'],
    _count: { riskTier: true },
  });

  const breakdown = { low: 0, medium: 0, high: 0 };
  for (const row of rows) {
    breakdown[row.riskTier as 'low' | 'medium' | 'high'] = row._count.riskTier;
  }
  return breakdown;
}

export async function countFlagged() {
  // "Flagged" = anything the analyst should look at, i.e. not low risk.
  return prisma.prediction.count({
    where: { riskTier: { in: ['medium', 'high'] } },
  });
}
