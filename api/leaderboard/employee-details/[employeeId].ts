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

    // Get employee basic info
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT e.Id, e.Name, e.cluster, e.CityId, cd.City as city_name
       FROM Executive e
       LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
       WHERE e.employee_id = ? AND e.deleted = 0 LIMIT 1`,
      employeeId
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const emp = employee[0];

    // Get daily achievements for today
    const today = new Date().toISOString().slice(0, 10);
    const dailyAchievements = await prisma.$queryRawUnsafe<any[]>(
      `SELECT dt.metric, dt.target, da.Achievement, da.variable_pay
       FROM DayTargets dt
       LEFT JOIN DayAchievement da ON dt.employee_id = da.employee_id
         AND dt.date = da.date
         AND dt.metric = da.metric
         AND da.deleted = 0
       WHERE dt.employee_id = ? AND dt.date = ? AND dt.deleted = 0
       ORDER BY dt.metric`,
      employeeId, today
    );

    // Get weekly achievements for current week
    const weeklyAchievements = await prisma.$queryRawUnsafe<any[]>(
      `SELECT wt.metric, wt.target, wa.Achievement, wa.variable_pay
       FROM WeekTargets wt
       LEFT JOIN WeekAchievement wa ON wt.employee_id = wa.employee_id
         AND wt.yearweek = wa.yearweek
         AND wt.metric = wa.metric
         AND wa.deleted = 0
       WHERE wt.employee_id = ? AND wt.yearweek = (
         SELECT MAX(yearweek) FROM WeekTargets WHERE employee_id = ? AND deleted = 0
       ) AND wt.deleted = 0
       ORDER BY wt.metric`,
      employeeId, employeeId
    );

    // Calculate totals
    const dailyTotal = {
      achievement: dailyAchievements.reduce((sum, item) => sum + Number(item.Achievement || 0), 0),
      target: dailyAchievements.reduce((sum, item) => sum + Number(item.target || 0), 0),
      earnings: dailyAchievements.reduce((sum, item) => sum + Number(item.variable_pay || 0), 0)
    };

    const weeklyTotal = {
      achievement: weeklyAchievements.reduce((sum, item) => sum + Number(item.Achievement || 0), 0),
      target: weeklyAchievements.reduce((sum, item) => sum + Number(item.target || 0), 0),
      earnings: weeklyAchievements.reduce((sum, item) => sum + Number(item.variable_pay || 0), 0)
    };

    res.json({
      status: 'success',
      data: {
        employee: {
          id: emp.Id,
          employee_id: employeeId,
          name: emp.Name,
          cluster: emp.cluster,
          city: emp.city_name,
          cityId: emp.CityId
        },
        daily: {
          date: today,
          metrics: dailyAchievements.map(item => ({
            metric: item.metric,
            achievement: Number(item.Achievement || 0),
            target: Number(item.target || 0),
            earnings: Number(item.variable_pay || 0),
            achievement_percentage: item.target > 0 ? ((item.Achievement || 0) / item.target * 100) : 0
          })),
          totals: dailyTotal
        },
        weekly: {
          metrics: weeklyAchievements.map(item => ({
            metric: item.metric,
            achievement: Number(item.Achievement || 0),
            target: Number(item.target || 0),
            earnings: Number(item.variable_pay || 0),
            achievement_percentage: item.target > 0 ? ((item.Achievement || 0) / item.target * 100) : 0
          })),
          totals: weeklyTotal
        }
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}
