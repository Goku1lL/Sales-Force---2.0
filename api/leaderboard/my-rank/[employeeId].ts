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

    // Get employee cluster first
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cluster FROM Executive WHERE employee_id = ? AND deleted = 0 LIMIT 1`,
      employeeId
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const cluster = employee[0].cluster || 'Unknown';

    // Calculate ranking within cluster
    const clusterRanking = await prisma.$queryRawUnsafe<any[]>(
      `SELECT @rank := @rank + 1 as rank, t.*
       FROM (
         SELECT
           e.employee_id,
           COALESCE(SUM(wa.Achievement), 0) as weekly_achievements
         FROM Executive e
         LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id
           AND wa.deleted = 0
           AND wa.yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE deleted = 0)
         WHERE e.deleted = 0 AND e.cluster = ?
         GROUP BY e.employee_id
         ORDER BY weekly_achievements DESC
       ) t
       CROSS JOIN (SELECT @rank := 0) r`,
      cluster
    );

    const userRank = clusterRanking.find(r => r.employee_id === employeeId);
    const rank = userRank ? Number(userRank.rank) : null;

    res.json({
      status: 'success',
      data: {
        employee_id: Number(employeeId),
        cluster: cluster,
        Ranking: rank,
        total_in_cluster: clusterRanking.length
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}
