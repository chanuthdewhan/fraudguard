import { Router } from 'express';
import { healthCheckHandler } from '../controllers/health.controller.js';
import {
  createTransaction,
  getDashboardStats,
  getModelInsights,
  getTransactionById,
  getTransactions,
  simulateTransaction,
  updateTransactionStatus,
} from '../controllers/transaction.controller.js';

export const router = Router();

// Health
router.get('/health', healthCheckHandler);

// Transactions & Review Queue
router.post('/transactions', createTransaction);
router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionById);
router.patch('/transactions/:id/status', updateTransactionStatus);

// Analytics & Simulation
router.get('/stats', getDashboardStats);
router.post('/simulate', simulateTransaction);
router.get('/model-info', getModelInsights);
