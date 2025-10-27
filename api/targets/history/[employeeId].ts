import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized } from '../_lib/auth';
import { getPrisma } from '../_lib/prisma';
import { serverError } from '../_lib/errors';

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
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM WeekTargets_History WHERE employee_id = ? ORDER BY yearweek DESC, metric`,
      String(employeeId)
    );
    
    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}
