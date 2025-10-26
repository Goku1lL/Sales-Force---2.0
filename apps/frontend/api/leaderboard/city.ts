import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cityId } = req.query;
    
    if (!cityId) {
      return res.status(400).json({ error: 'City ID is required' });
    }

    // Get city leaderboard
    const leaderboard = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        e.employee_id,
        e.Name,
        e.CityId,
        c.city_name,
        SUM(da.Achievement) as weekly_achievements,
        ROW_NUMBER() OVER (ORDER BY SUM(da.Achievement) DESC) as rank
      FROM Executive e
      LEFT JOIN DayAchievement da ON e.employee_id = da.employee_id 
        AND da.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND da.deleted = 0
      LEFT JOIN City c ON e.CityId = c.CityId
      WHERE e.CityId = ?
      GROUP BY e.employee_id, e.Name, e.CityId, c.city_name
      ORDER BY weekly_achievements DESC
      LIMIT 10
    `, cityId);

    res.status(200).json({
      success: true,
      data: leaderboard.map((item: any) => ({
        employee_id: item.employee_id,
        name: item.Name,
        city_id: item.CityId,
        city_name: item.city_name,
        weekly_achievements: item.weekly_achievements || 0,
        rank: item.rank
      }))
    });

  } catch (error) {
    console.error('City leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
