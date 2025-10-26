import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized } from '../../../../_lib/auth';
import { getPrisma } from '../../../../_lib/prisma';
import { serverError } from '../../../../_lib/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    const date = req.query.date as string;
    
    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const prisma = getPrisma();
    
    // Get all day achievements for the employee and date
    const allAchievements = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        employee_id,
        date,
        metric,
        Achievement,
        variable_pay,
        contribution
      FROM DayAchievement
      WHERE employee_id = ? AND date = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), date);
    
    res.json({ status: 'success', data: allAchievements });
  } catch (error) {
    return serverError(res, error);
  }
}
