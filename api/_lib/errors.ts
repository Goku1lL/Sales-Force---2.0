import type { VercelResponse } from '@vercel/node';

export function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'Unauthorized' });
}

export function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({ error: message });
}

export function serverError(res: VercelResponse, error: unknown) {
  console.error('Server error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
