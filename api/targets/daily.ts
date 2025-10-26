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

    const { employeeId, date } = req.query;
    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM DayTargets WHERE employee_id = ? AND date = ? AND deleted = 0 ORDER BY metric`,
      String(employeeId), date
    );
    
    res.status(200).json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    return handleError(res, error);
  }
}
