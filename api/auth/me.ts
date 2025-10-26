import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthPayload {
  sub: number;
  name?: string;
  role?: string;
}

function requireAuth(req: VercelRequest, res: VercelResponse): AuthPayload | null {
  try {
    const header = req.headers['authorization'];
    if (!header) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return null;
    }
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Invalid Authorization header' });
      return null;
    }
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload | string;

    let user: AuthPayload;
    if (typeof decoded === 'string') {
      user = { sub: 0 };
    } else {
      const subRaw = decoded.sub as unknown;
      const subNum = typeof subRaw === 'string' ? Number(subRaw) : typeof subRaw === 'number' ? subRaw : 0;
      user = {
        sub: subNum,
        name: typeof decoded["name"] === 'string' ? decoded["name"] : undefined,
        role: typeof decoded["role"] === 'string' ? decoded["role"] : undefined,
      };
    }
    return user;
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    return res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
