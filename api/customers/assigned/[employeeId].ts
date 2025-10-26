import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized } from '../../../_lib/auth';
import { getPrisma } from '../../../_lib/prisma';
import { serverError } from '../../../_lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();
    // Approximation: customers in localities mapped to executive current week
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c.CustomerId, c.Customer, c.City, c.ContactNumber, c.CustomerSegment, c.CustomerType, c.Status, c.ExecutiveId, c.Executive
       FROM FnVCustomer_Dim c
       WHERE c.Status = 'active'
       ORDER BY c.CustomerId DESC LIMIT 200`
    );
    
    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}
