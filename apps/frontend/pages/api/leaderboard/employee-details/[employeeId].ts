import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId || typeof employeeId !== 'string') {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    // Get employee details with daily and weekly metrics
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        e.employee_id,
        e.name,
        e.cluster,
        e.city,
        e.CityId,
        e.variable_pay
       FROM Executive e
       WHERE e.employee_id = ?`,
      employeeId
    );

    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Get daily metrics
    const dailyMetrics = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        dt.metric,
        dt.target,
        dt.slab_Segment,
        dt.incentive_percent,
        COALESCE(da.Achievement, 0) as achievement,
        COALESCE(da.variable_pay, 0) as variable_pay
       FROM DayTargets dt
       LEFT JOIN DayAchievement da ON dt.employee_id = da.employee_id
         AND dt.date = da.date
         AND dt.metric = da.metric
         AND da.deleted = 0
       WHERE dt.employee_id = ? AND dt.date = ? AND dt.deleted = 0
       ORDER BY dt.metric, dt.slab_Segment`,
      employeeId, today
    );

    // Get weekly metrics
    const weeklyMetrics = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        wt.metric,
        wt.target,
        wt.slab_Segment,
        wt.incentive_percent,
        COALESCE(wa.Achievement, 0) as achievement,
        COALESCE(wa.variable_pay, 0) as variable_pay
       FROM WeekTargets wt
       LEFT JOIN WeekAchievement wa ON wt.employee_id = wa.employee_id
         AND wt.yearweek = wa.yearweek
         AND wt.metric = wa.metric
         AND wa.deleted = 0
       WHERE wt.employee_id = ? AND wt.yearweek = YEARWEEK(NOW()) AND wt.deleted = 0
       ORDER BY wt.metric, wt.slab_Segment`,
      employeeId
    );

    const response = {
      employee: employee[0],
      daily: {
        metrics: dailyMetrics,
        totals: {
          target: dailyMetrics.reduce((sum, m) => sum + Number(m.target || 0), 0),
          achievement: dailyMetrics.reduce((sum, m) => sum + Number(m.achievement || 0), 0),
          earnings: dailyMetrics.reduce((sum, m) => sum + Number(m.variable_pay || 0), 0),
        }
      },
      weekly: {
        metrics: weeklyMetrics,
        totals: {
          target: weeklyMetrics.reduce((sum, m) => sum + Number(m.target || 0), 0),
          achievement: weeklyMetrics.reduce((sum, m) => sum + Number(m.achievement || 0), 0),
          earnings: weeklyMetrics.reduce((sum, m) => sum + Number(m.variable_pay || 0), 0),
        }
      }
    };

    res.status(200).json({ data: response });
  } catch (error) {
    console.error('Employee details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
