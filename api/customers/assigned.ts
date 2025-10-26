import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrisma } from '../_utils/prisma';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return; // Response already sent by requireAuth

    const { employeeId } = req.query;
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
    
    res.status(200).json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    return handleError(res, error);
  }
}
