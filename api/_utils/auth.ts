import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthPayload {
  sub: number;
  name?: string;
  role?: string;
}

/**
 * Verify JWT token from request and return user payload
 * Returns null if authentication fails
 */
export function verifyAuth(req: VercelRequest): AuthPayload | null {
  try {
    const header = req.headers['authorization'];
    if (!header) return null;
    
    const [type, token] = String(header).split(' ');
    if (type !== 'Bearer' || !token) return null;
    
    const secret = process.env.JWT_SECRET as string;
    if (!secret) throw new Error('JWT_SECRET not configured');
    
    const decoded = jwt.verify(token, secret) as JwtPayload | string;

    if (typeof decoded === 'string') {
      return { sub: 0 };
    }
    
    const subRaw = decoded.sub as unknown;
    const subNum = typeof subRaw === 'string' ? Number(subRaw) : typeof subRaw === 'number' ? subRaw : 0;
    
    return {
      sub: subNum,
      name: typeof decoded["name"] === 'string' ? decoded["name"] : undefined,
      role: typeof decoded["role"] === 'string' ? decoded["role"] : undefined,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Middleware-style auth check for serverless functions
 * Returns true if auth succeeds, false if it fails (and sends error response)
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): AuthPayload | false {
  const user = verifyAuth(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return user;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ sub: payload.sub, name: payload.name, role: payload.role }, secret, {
    expiresIn: '7d'
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: AuthPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string;
  return jwt.sign({ sub: payload.sub }, secret, {
    expiresIn: '30d'
  });
}

