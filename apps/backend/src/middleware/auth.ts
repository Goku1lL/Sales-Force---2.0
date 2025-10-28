import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthPayload {
  sub: string;
  name?: string;
  role?: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'Invalid Authorization header' });
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload | string;

    let user: AuthPayload;
    if (typeof decoded === 'string') {
      // minimal
      user = { sub: '' };
    } else {
      const subRaw = decoded.sub as unknown;
      const subStr = typeof subRaw === 'string' ? subRaw : typeof subRaw === 'number' ? String(subRaw) : '';
      user = {
        sub: subStr,
        name: typeof decoded["name"] === 'string' ? decoded["name"] : undefined,
        role: typeof decoded["role"] === 'string' ? decoded["role"] : undefined,
      };
    }

    (req as any).user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
