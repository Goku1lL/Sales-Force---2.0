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

    // Get employee's rank in cluster and city
    const clusterRank = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
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
        END as achievement_percentage,
        ROW_NUMBER() OVER (ORDER BY 
          CASE 
            WHEN SUM(COALESCE(dt.target, 0)) > 0 
            THEN (SUM(COALESCE(da.Achievement, 0)) / SUM(COALESCE(dt.target, 0))) * 100 
            ELSE 0 
          END DESC
        ) as cluster_rank
       FROM Executive e
       LEFT JOIN DayTargets dt ON e.employee_id = dt.employee_id AND dt.date = CURDATE() AND dt.deleted = 0
       LEFT JOIN DayAchievement da ON e.employee_id = da.employee_id AND da.date = CURDATE() AND da.deleted = 0
       WHERE e.cluster = (SELECT cluster FROM Executive WHERE employee_id = ?)
       GROUP BY e.employee_id, e.name, e.cluster, e.city
       HAVING e.employee_id = ?`,
      employeeId, employeeId
    );

    const cityRank = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
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
        END as achievement_percentage,
        ROW_NUMBER() OVER (ORDER BY 
          CASE 
            WHEN SUM(COALESCE(dt.target, 0)) > 0 
            THEN (SUM(COALESCE(da.Achievement, 0)) / SUM(COALESCE(dt.target, 0))) * 100 
            ELSE 0 
          END DESC
        ) as city_rank
       FROM Executive e
       LEFT JOIN DayTargets dt ON e.employee_id = dt.employee_id AND dt.date = CURDATE() AND dt.deleted = 0
       LEFT JOIN DayAchievement da ON e.employee_id = da.employee_id AND da.date = CURDATE() AND da.deleted = 0
       WHERE e.CityId = (SELECT CityId FROM Executive WHERE employee_id = ?)
       GROUP BY e.employee_id, e.name, e.cluster, e.city
       HAVING e.employee_id = ?`,
      employeeId, employeeId
    );

    const response = {
      cluster_rank: clusterRank[0]?.cluster_rank || 0,
      city_rank: cityRank[0]?.city_rank || 0,
      achievement_percentage: clusterRank[0]?.achievement_percentage || 0,
    };

    res.status(200).json({ data: response });
  } catch (error) {
    console.error('My rank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
