import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

export function verifyToken(req: VercelRequest): { sub: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET as string;
  
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string') return null;
    return decoded as unknown as { sub: number; role: string };
  } catch {
    return null;
  }
}

export function unauthorized(res: any) {
  return res.status(401).json({ error: 'Unauthorized' });
}

export function badRequest(res: any, message: string) {
  return res.status(400).json({ error: message });
}

export function serverError(res: any, error: unknown) {
  console.error('Server error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}