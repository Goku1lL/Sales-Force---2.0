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
    const yearweek = req.query.yearweek as string;
    
    if (!employeeId || !yearweek) {
      return res.status(400).json({ error: 'employeeId and yearweek are required' });
    }

    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM WeekTargets WHERE employee_id = ? AND yearweek = ? AND deleted = 0 ORDER BY metric`,
      String(employeeId), Number(yearweek)
    );
    
    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}
