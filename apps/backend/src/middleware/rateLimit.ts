import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_REQUESTS = 300;

const hits = new Map<string, { count: number; start: number }>();

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry) {
    hits.set(key, { count: 1, start: now });
    return next();
  }
  if (now - entry.start > WINDOW_MS) {
    hits.set(key, { count: 1, start: now });
    return next();
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ message: 'Too many requests' });
  }
  next();
}
