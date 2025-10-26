import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

export function verifyToken(req: VercelRequest): { sub: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET as string;
  
  try {
    return jwt.verify(token, secret) as { sub: number; role: string };
  } catch {
    return null;
  }
}
