import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../_utils/prisma';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ message: 'token required' });
    }

    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;
    
    const prisma = getPrisma();
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET status = 'active' WHERE email = ?`, email);
    
    return res.json({ message: 'Account verified' });
  } catch (error) {
    return handleError(res, error);
  }
}
