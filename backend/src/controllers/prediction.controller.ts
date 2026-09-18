import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  scoreTransaction,
  getTransaction,
  getRecentTransactions,
} from '../services/prediction.service.js';
import type { RiskTier } from '../types/transaction.js';

const VALID_RISK_TIERS: RiskTier[] = ['low', 'medium', 'high'];

const transactionSchema = z.object({
  step: z.number().int().nonnegative(),
  type: z.enum(['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER']),
  amount: z.number().positive(),
  nameOrig: z.string(),
  oldBalanceOrg: z.number().nonnegative(),
  newBalanceOrg: z.number().nonnegative(),
  nameDest: z.string(),
  oldBalanceDest: z.number().nonnegative(),
  newBalanceDest: z.number().nonnegative(),
});

export async function predictHandler(req: Request, res: Response) {
  const parsed = transactionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: { message: 'Invalid transaction data', code: 'VALIDATION_ERROR' },
      details: parsed.error.flatten(),
    });
  }

  try {
    const transaction = await scoreTransaction(parsed.data);
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Prediction failed:', err);
    res
      .status(502)
      .json({ error: { message: 'ML service unavailable', code: 'UPSTREAM_SERVICE_ERROR' } });
  }
}

export async function getTransactionHandler(req: Request, res: Response) {
  const { id } = req.params;

  if (typeof id !== 'string') {
    return res
      .status(400)
      .json({ error: { message: 'Invalid transaction id', code: 'VALIDATION_ERROR' } });
  }

  const transaction = await getTransaction(id);

  if (!transaction) {
    return res.status(404).json({ error: { message: 'Transaction not found', code: 'NOT_FOUND' } });
  }

  res.json(transaction);
}

function parseRiskTier(value: unknown): RiskTier | undefined {
  return typeof value === 'string' && VALID_RISK_TIERS.includes(value as RiskTier)
    ? (value as RiskTier)
    : undefined;
}

export async function listTransactionsHandler(req: Request, res: Response) {
  const riskTier = parseRiskTier(req.query.riskTier);
  const transactions = await getRecentTransactions(riskTier);
  res.json({ transactions });
}
