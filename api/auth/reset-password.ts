import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../_utils/prisma';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and newPassword required' });
    }

    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;
    
    const prisma = getPrisma();
    const password_hash = await bcrypt.hash(String(newPassword), 12);
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET password_hash = ? WHERE email = ?`, password_hash, email);
    
    return res.json({ message: 'Password updated' });
  } catch (error) {
    return handleError(res, error);
  }
}
