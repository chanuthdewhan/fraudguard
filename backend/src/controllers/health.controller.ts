import type { Request, Response } from 'express';

export function healthCheckHandler(_req: Request, res: Response) {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
}
