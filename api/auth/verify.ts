import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getPrisma, badRequest, serverError } from '@sfa/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body || {};
    if (!token) return badRequest(res, 'token required');
    
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;
    
    const prisma = getPrisma();
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET status = 'active' WHERE email = ?`, email);
    
    return res.json({ message: 'Account verified' });
  } catch (error) {
    return serverError(res, error);
  }
}
