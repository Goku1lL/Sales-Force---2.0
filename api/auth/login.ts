import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrisma } from '@sfa/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employee_id, email, password } = req.body || {};
    if ((!employee_id && !email) || !password) {
      return res.status(400).json({ message: 'employee_id or email and password are required' });
    }

    // For now, use mock authentication until database is properly configured
    // TODO: Replace with real database queries
    if (password === 'password123') {
      const secret = process.env.JWT_SECRET as string || 'fallback-secret';
      const refreshSecret = process.env.JWT_REFRESH_SECRET as string || secret;

      const accessToken = jwt.sign(
        { sub: Number(employee_id) || 1, name: 'Test User', role: 'executive' },
        secret,
        { expiresIn: '7d' }
      );
      const refreshToken = jwt.sign(
        { sub: Number(employee_id) || 1 },
        refreshSecret,
        { expiresIn: '30d' }
      );

      return res.json({
        token: accessToken,
        refreshToken,
        user: {
          id: 1,
          employee_id: Number(employee_id) || 1,
          name: 'Test User',
          email: email || 'test@example.com',
          role: 'executive',
          status: 'active'
        }
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
