import jwt from 'jsonwebtoken';
import type { IncomingMessage } from 'http';

export function verifyToken(req: IncomingMessage): { sub: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET as string;

  try {
    const decoded = jwt.verify(token, secret) as unknown;
    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && 'role' in decoded) {
      const subRaw = (decoded as any).sub;
      const sub = typeof subRaw === 'string' ? subRaw : typeof subRaw === 'number' ? String(subRaw) : '';
      return { sub, role: String((decoded as any).role) };
    }
    return null;
  } catch {
    return null;
  }
}