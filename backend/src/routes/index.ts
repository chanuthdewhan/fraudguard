import { Router } from 'express';
import { healthCheckHandler } from '../controllers/health.controller.js';
import {
  getTransactionHandler,
  listTransactionsHandler,
  predictHandler,
} from '../controllers/prediction.controller.js';
import { getStatsHandler } from '../controllers/stats.controller.js';

export const router = Router();

// Health
router.get('/health', healthCheckHandler);

// Prediction
router.post('/predict', predictHandler);
router.get('/transactions', listTransactionsHandler);
router.get('/transactions/:id', getTransactionHandler);

// Stats
router.get('/stats', getStatsHandler);
