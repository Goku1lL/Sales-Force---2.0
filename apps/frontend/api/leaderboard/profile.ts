import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    // Get user profile with rankings
    const userProfile = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        e.employee_id,
        e.Name,
        e.cluster,
        e.CityId,
        c.city_name,
        SUM(da.Achievement) as weekly_achievements,
        ROW_NUMBER() OVER (PARTITION BY e.cluster ORDER BY SUM(da.Achievement) DESC) as cluster_rank,
        ROW_NUMBER() OVER (PARTITION BY e.CityId ORDER BY SUM(da.Achievement) DESC) as city_rank
      FROM Executive e
      LEFT JOIN DayAchievement da ON e.employee_id = da.employee_id 
        AND da.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND da.deleted = 0
      LEFT JOIN City c ON e.CityId = c.CityId
      WHERE e.employee_id = ?
      GROUP BY e.employee_id, e.Name, e.cluster, e.CityId, c.city_name
    `, employeeId);

    if (userProfile.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = userProfile[0];

    res.status(200).json({
      success: true,
      data: {
        employee_id: profile.employee_id,
        name: profile.Name,
        cluster: profile.cluster,
        city_id: profile.CityId,
        city_name: profile.city_name,
        weekly_achievements: profile.weekly_achievements || 0,
        cluster_rank: profile.cluster_rank,
        city_rank: profile.city_rank
      }
    });

  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
