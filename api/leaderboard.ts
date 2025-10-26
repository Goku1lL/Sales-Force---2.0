import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrisma } from '../_utils/prisma';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    // Route based on URL path
    if (url?.includes('/city')) {
      return await handleCity(req, res);
    } else if (url?.includes('/cluster')) {
      return await handleCluster(req, res);
    } else if (url?.includes('/profile')) {
      return await handleProfile(req, res);
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

async function handleCity(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cityId } = req.query;
  if (!cityId) {
    return res.status(400).json({ error: 'City ID is required' });
  }

  const prisma = getPrisma();
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
}

async function handleCluster(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cluster } = req.query;
  if (!cluster) {
    return res.status(400).json({ error: 'Cluster is required' });
  }

  const prisma = getPrisma();
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
}

async function handleProfile(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  const prisma = getPrisma();
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
}
