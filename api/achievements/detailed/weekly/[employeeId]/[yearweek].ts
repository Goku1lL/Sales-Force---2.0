import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

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
    
    // Get all week achievements for the employee and yearweek
    const allAchievements: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        employee_id,
        yearweek,
        metric,
        Achievement,
        variable_pay,
        contribution
      FROM WeekAchievement
      WHERE employee_id = ? AND yearweek = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), Number(yearweek));
    
    res.json({ status: 'success', data: allAchievements });
  } catch (error) {
    return serverError(res, error);
  }
}
