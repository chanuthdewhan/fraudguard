import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { mlClient } from '../services/mlClient.js';

const TransactionSchema = z.object({
  step: z.number().int().positive().default(1),
  type: z.enum(['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER']),
  amount: z.number().nonnegative(),
  nameOrig: z.string().min(1),
  oldbalanceOrg: z.number().nonnegative(),
  newbalanceOrig: z.number().nonnegative(),
  nameDest: z.string().min(1),
  oldbalanceDest: z.number().nonnegative(),
  newbalanceDest: z.number().nonnegative(),
});

const StatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED']),
  analystNotes: z.string().optional(),
});

export async function createTransaction(req: Request, res: Response) {
  try {
    const data = TransactionSchema.parse(req.body);

    // Call ML service for scoring and SHAP explainability
    const explanationResult = await mlClient.explain(data, 5);
    const { prediction } = explanationResult;

    const transaction = await prisma.transaction.create({
      data: {
        step: data.step,
        type: data.type,
        amount: data.amount,
        nameOrig: data.nameOrig,
        oldbalanceOrg: data.oldbalanceOrg,
        newbalanceOrig: data.newbalanceOrig,
        nameDest: data.nameDest,
        oldbalanceDest: data.oldbalanceDest,
        newbalanceDest: data.newbalanceDest,
        riskScore: prediction.risk_score,
        riskTier: prediction.risk_tier,
        isFraud: prediction.is_fraud,
        fraudProbability: prediction.fraud_probability,
        status: 'PENDING',
        explanation: explanationResult as unknown as object,
      },
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to create and score transaction' });
  }
}

export async function getTransactions(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const riskTier = req.query.riskTier as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (riskTier && ['LOW', 'MEDIUM', 'HIGH'].includes(riskTier.toUpperCase())) {
      where.riskTier = riskTier.toUpperCase();
    }
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { nameOrig: { contains: search, mode: 'insensitive' } },
        { nameDest: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

export async function getTransactionById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
}

export async function updateTransactionStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = StatusUpdateSchema.parse(req.body);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: body.status,
        analystNotes: body.analystNotes,
        reviewedAt: new Date(),
      },
    });

    res.json(transaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid review status payload', details: error.errors });
      return;
    }
    console.error('Error updating transaction status:', error);
    res.status(500).json({ error: 'Failed to update transaction status' });
  }
}

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const [
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      pending,
      approved,
      rejected,
      escalated,
      fraudPredicted,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { riskTier: 'HIGH' } }),
      prisma.transaction.count({ where: { riskTier: 'MEDIUM' } }),
      prisma.transaction.count({ where: { riskTier: 'LOW' } }),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'APPROVED' } }),
      prisma.transaction.count({ where: { status: 'REJECTED' } }),
      prisma.transaction.count({ where: { status: 'ESCALATED' } }),
      prisma.transaction.count({ where: { isFraud: true } }),
    ]);

    const fraudRate = total > 0 ? Number(((fraudPredicted / total) * 100).toFixed(2)) : 0.0;

    res.json({
      totalTransactions: total,
      flaggedCount: highRisk,
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      escalatedCount: escalated,
      fraudRate,
      riskDistribution: {
        high: highRisk,
        medium: mediumRisk,
        low: lowRisk,
      },
      statusDistribution: {
        pending,
        approved,
        rejected,
        escalated,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to compute dashboard stats' });
  }
}

export async function simulateTransaction(req: Request, res: Response) {
  try {
    const SimulationSchema = z.object({
      original: TransactionSchema,
      modified: TransactionSchema,
    });
    const { original, modified } = SimulationSchema.parse(req.body);
    const result = await mlClient.simulate(original, modified);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid simulation payload', details: error.errors });
      return;
    }
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message || 'Simulation failed' });
  }
}

export async function getModelInsights(_req: Request, res: Response) {
  try {
    const info = await mlClient.getModelInfo();
    res.json(info);
  } catch (error: any) {
    console.error('Model insights error:', error);
    res.status(500).json({ error: 'Failed to retrieve model insights' });
  }
}

