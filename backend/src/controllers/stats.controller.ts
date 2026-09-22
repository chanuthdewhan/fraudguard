import type { Request, Response } from 'express';
import { getStats } from '../services/stats.service.js';

export async function getStatsHandler(_req: Request, res: Response) {
  const stats = await getStats();
  res.json(stats);
}
