import { IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { cityId, period } = req.query;
    
    if (!cityId || typeof cityId !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'cityId is required' }));
      return;
    }

    if (!period || typeof period !== 'string' || !['day', 'week'].includes(period)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'period must be day or week' }));
      return;
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

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: leaderboard }));
  } catch (error) {
    console.error('City leaderboard error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
