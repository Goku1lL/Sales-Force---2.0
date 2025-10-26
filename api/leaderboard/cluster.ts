import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrisma } from '../_utils/prisma';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return; // Response already sent by requireAuth

    const { cluster } = req.query;
    const prisma = getPrisma();
    
    if (!cluster) {
      return res.status(400).json({ error: 'Cluster is required' });
    }

    // Get cluster leaderboard
    const leaderboard = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        e.employee_id,
        e.Name,
        e.cluster,
        SUM(da.Achievement) as weekly_achievements,
        ROW_NUMBER() OVER (ORDER BY SUM(da.Achievement) DESC) as rank
      FROM Executive e
      LEFT JOIN DayAchievement da ON e.employee_id = da.employee_id 
        AND da.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND da.deleted = 0
      WHERE e.cluster = ?
      GROUP BY e.employee_id, e.Name, e.cluster
      ORDER BY weekly_achievements DESC
      LIMIT 10
    `, cluster);

    res.status(200).json({
      success: true,
      data: leaderboard.map((item: any) => ({
        employee_id: item.employee_id,
        name: item.Name,
        cluster: item.cluster,
        weekly_achievements: item.weekly_achievements || 0,
        rank: item.rank
      }))
    });

  } catch (error) {
    return handleError(res, error);
  }
}
