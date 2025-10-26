import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../_utils/prisma';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employee_id, email, password } = req.body || {};
    if ((!employee_id && !email) || !password) {
      return res.status(400).json({ message: 'employee_id or email and password are required' });
    }

    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM SalesApp_Login WHERE ${employee_id ? 'employee_id = ?' : 'email = ?'} AND deleted = 0 LIMIT 1`,
      employee_id ?? email
    );

    const user = rows?.[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (String(user.status) === 'pending') return res.status(403).json({ message: 'Please verify your email' });

    const ok = await bcrypt.compare(String(password), String(user.password_hash));
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    await prisma.$executeRawUnsafe(
      `UPDATE SalesApp_Login SET last_login = NOW() WHERE Id = ?`,
      user.Id
    );

    const secret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string || secret;

    const accessToken = jwt.sign(
      { sub: Number(user.employee_id), name: String(user.full_name), role: String(user.role) },
      secret,
      { expiresIn: '7d' }
    );
    const refreshToken = jwt.sign(
      { sub: Number(user.employee_id) },
      refreshSecret,
      { expiresIn: '30d' }
    );

    return res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: Number(user.Id),
        employee_id: Number(user.employee_id),
        name: String(user.full_name),
        email: String(user.email),
        role: String(user.role),
        status: String(user.status)
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
}
