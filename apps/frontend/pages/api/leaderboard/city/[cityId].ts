import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cityId, period } = req.query;
    
    if (!cityId || typeof cityId !== 'string') {
      return res.status(400).json({ error: 'cityId is required' });
    }

    if (!period || typeof period !== 'string' || !['day', 'week'].includes(period)) {
      return res.status(400).json({ error: 'period must be day or week' });
    }

    let query = '';
    if (period === 'day') {
      query = `SELECT 
        e.employee_id,
        e.name,
        e.cluster,
        e.city,
        SUM(COALESCE(da.Achievement, 0)) as total_achievement,
        SUM(COALESCE(dt.target, 0)) as total_target,
        CASE 
          WHEN SUM(COALESCE(dt.target, 0)) > 0 
          THEN (SUM(COALESCE(da.Achievement, 0)) / SUM(COALESCE(dt.target, 0))) * 100 
          ELSE 0 
        END as achievement_percentage
       FROM Executive e
       LEFT JOIN DayTargets dt ON e.employee_id = dt.employee_id AND dt.date = CURDATE() AND dt.deleted = 0
       LEFT JOIN DayAchievement da ON e.employee_id = da.employee_id AND da.date = CURDATE() AND da.deleted = 0
       WHERE e.CityId = ?
       GROUP BY e.employee_id, e.name, e.cluster, e.city
       ORDER BY achievement_percentage DESC`;
    } else {
      query = `SELECT 
        e.employee_id,
        e.name,
        e.cluster,
        e.city,
        SUM(COALESCE(wa.Achievement, 0)) as total_achievement,
        SUM(COALESCE(wt.target, 0)) as total_target,
        CASE 
          WHEN SUM(COALESCE(wt.target, 0)) > 0 
          THEN (SUM(COALESCE(wa.Achievement, 0)) / SUM(COALESCE(wt.target, 0))) * 100 
          ELSE 0 
        END as achievement_percentage
       FROM Executive e
       LEFT JOIN WeekTargets wt ON e.employee_id = wt.employee_id AND wt.yearweek = YEARWEEK(NOW()) AND wt.deleted = 0
       LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id AND wa.yearweek = YEARWEEK(NOW()) AND wa.deleted = 0
       WHERE e.CityId = ?
       GROUP BY e.employee_id, e.name, e.cluster, e.city
       ORDER BY achievement_percentage DESC`;
    }

    const leaderboard = await prisma.$queryRawUnsafe<any[]>(query, parseInt(cityId));

    res.status(200).json({ data: leaderboard });
  } catch (error) {
    console.error('City leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
