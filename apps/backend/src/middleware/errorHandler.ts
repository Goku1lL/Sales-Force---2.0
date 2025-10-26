import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message = err?.message || 'Internal server error';
  res.status(status).json({ status: 'error', message });
}
