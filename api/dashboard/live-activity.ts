import { IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: IncomingMessage & { query: Record<string, string | string[]> }, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Get live activity - recent achievements and activities
    const liveActivity = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        e.name as employee_name,
        e.cluster,
        da.metric,
        da.Achievement,
        da.date,
        'Daily Achievement' as activity_type
       FROM DayAchievement da
       JOIN Executive e ON da.employee_id = e.employee_id
       WHERE da.date = CURDATE() AND da.deleted = 0
       ORDER BY da.created_at DESC
       LIMIT 10
       
       UNION ALL
       
       SELECT 
        e.name as employee_name,
        e.cluster,
        wa.metric,
        wa.Achievement,
        wa.yearweek as date,
        'Weekly Achievement' as activity_type
       FROM WeekAchievement wa
       JOIN Executive e ON wa.employee_id = e.employee_id
       WHERE wa.yearweek = YEARWEEK(NOW()) AND wa.deleted = 0
       ORDER BY wa.created_at DESC
       LIMIT 10`
    );

    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ data: liveActivity });
  } catch (error) {
    console.error('Live activity error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Internal server error' });
  }
}
