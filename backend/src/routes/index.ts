import { Router } from 'express';
import { healthCheckHandler } from '../controllers/health.controller.js';

export const router = Router();

router.get('/health', healthCheckHandler);
