import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    res.status(200).json({ data: liveActivity });
  } catch (error) {
    console.error('Live activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
