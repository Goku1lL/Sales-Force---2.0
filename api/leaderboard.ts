import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/leaderboard/
  const match = path.match(/\/api\/leaderboard\/(.+)/);
  return match ? match[1] : '';
}

// Handler: GET /api/leaderboard/city/[cityId]
async function handleCity(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const leaderboard = [
      { employee_id: 1, name: 'John Doe', city_id: 2, city_name: 'Bangalore', weekly_achievements: 150, rank: 1 },
      { employee_id: 2, name: 'Jane Smith', city_id: 2, city_name: 'Bangalore', weekly_achievements: 120, rank: 2 },
      { employee_id: 3, name: 'Bob Johnson', city_id: 2, city_name: 'Bangalore', weekly_achievements: 100, rank: 3 }
    ];

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('City leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: GET /api/leaderboard/cluster/[cluster]
async function handleCluster(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const leaderboard = [
      { employee_id: 1, name: 'John Doe', cluster: 'BLR-Cluster1', weekly_achievements: 150, rank: 1 },
      { employee_id: 2, name: 'Jane Smith', cluster: 'BLR-Cluster1', weekly_achievements: 120, rank: 2 },
      { employee_id: 3, name: 'Bob Johnson', cluster: 'BLR-Cluster1', weekly_achievements: 100, rank: 3 }
    ];

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Cluster leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: GET /api/leaderboard/employee-details/[employeeId]
async function handleEmployeeDetails(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();

    // Get employee basic info
    const employee: any[] = await prisma.$queryRawUnsafe(
      `SELECT e.Id, e.Name, e.cluster, e.CityId, cd.City as city_name
       FROM Executive e
       LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
       WHERE e.employee_id = ? AND e.deleted = 0 LIMIT 1`,
      employeeId
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const emp = employee[0];

    // Get daily achievements for today
    const today = new Date().toISOString().slice(0, 10);
    const dailyAchievements: any[] = await prisma.$queryRawUnsafe(
      `SELECT dt.metric, dt.target, da.Achievement, da.variable_pay
       FROM DayTargets dt
       LEFT JOIN DayAchievement da ON dt.employee_id = da.employee_id
         AND dt.date = da.date
         AND dt.metric = da.metric
         AND da.deleted = 0
       WHERE dt.employee_id = ? AND dt.date = ? AND dt.deleted = 0
       ORDER BY dt.metric`,
      employeeId, today
    );

    // Get weekly achievements for current week
    const weeklyAchievements: any[] = await prisma.$queryRawUnsafe(
      `SELECT wt.metric, wt.target, wa.Achievement, wa.variable_pay
       FROM WeekTargets wt
       LEFT JOIN WeekAchievement wa ON wt.employee_id = wa.employee_id
         AND wt.yearweek = wa.yearweek
         AND wt.metric = wa.metric
         AND wa.deleted = 0
       WHERE wt.employee_id = ? AND wt.yearweek = (
         SELECT MAX(yearweek) FROM WeekTargets WHERE employee_id = ? AND deleted = 0
       ) AND wt.deleted = 0
       ORDER BY wt.metric`,
      employeeId, employeeId
    );

    // Calculate totals
    const dailyTotal = {
      achievement: dailyAchievements.reduce((sum, item) => sum + Number(item.Achievement || 0), 0),
      target: dailyAchievements.reduce((sum, item) => sum + Number(item.target || 0), 0),
      earnings: dailyAchievements.reduce((sum, item) => sum + Number(item.variable_pay || 0), 0)
    };

    const weeklyTotal = {
      achievement: weeklyAchievements.reduce((sum, item) => sum + Number(item.Achievement || 0), 0),
      target: weeklyAchievements.reduce((sum, item) => sum + Number(item.target || 0), 0),
      earnings: weeklyAchievements.reduce((sum, item) => sum + Number(item.variable_pay || 0), 0)
    };

    res.json({
      status: 'success',
      data: {
        employee: {
          id: emp.Id,
          employee_id: employeeId,
          name: emp.Name,
          cluster: emp.cluster,
          city: emp.city_name,
          cityId: emp.CityId
        },
        daily: {
          date: today,
          metrics: dailyAchievements.map(item => ({
            metric: item.metric,
            achievement: Number(item.Achievement || 0),
            target: Number(item.target || 0),
            earnings: Number(item.variable_pay || 0),
            achievement_percentage: item.target > 0 ? ((item.Achievement || 0) / item.target * 100) : 0
          })),
          totals: dailyTotal
        },
        weekly: {
          metrics: weeklyAchievements.map(item => ({
            metric: item.metric,
            achievement: Number(item.Achievement || 0),
            target: Number(item.target || 0),
            earnings: Number(item.variable_pay || 0),
            achievement_percentage: item.target > 0 ? ((item.Achievement || 0) / item.target * 100) : 0
          })),
          totals: weeklyTotal
        }
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/leaderboard/my-rank/[employeeId]
async function handleMyRank(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();

    // Get employee cluster first
    const employee: any[] = await prisma.$queryRawUnsafe(
      `SELECT cluster FROM Executive WHERE employee_id = ? AND deleted = 0 LIMIT 1`,
      employeeId
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const cluster = employee[0].cluster || 'Unknown';

    // Calculate ranking within cluster
    const clusterRanking: any[] = await prisma.$queryRawUnsafe(
      `SELECT @rank := @rank + 1 as rank, t.*
       FROM (
         SELECT
           e.employee_id,
           COALESCE(SUM(wa.Achievement), 0) as weekly_achievements
         FROM Executive e
         LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id
           AND wa.deleted = 0
           AND wa.yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE deleted = 0)
         WHERE e.deleted = 0 AND e.cluster = ?
         GROUP BY e.employee_id
         ORDER BY weekly_achievements DESC
       ) t
       CROSS JOIN (SELECT @rank := 0) r`,
      cluster
    );

    const userRank = clusterRanking.find(r => r.employee_id === employeeId);
    const rank = userRank ? Number(userRank.rank) : null;

    res.json({
      status: 'success',
      data: {
        employee_id: Number(employeeId),
        cluster: cluster,
        Ranking: rank,
        total_in_cluster: clusterRanking.length
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/leaderboard/profile/[employeeId]
async function handleProfile(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const profile = {
      employee_id: 1,
      name: 'John Doe',
      cluster: 'BLR-Cluster1',
      city_id: 2,
      city_name: 'Bangalore',
      weekly_achievements: 150,
      cluster_rank: 1,
      city_rank: 1
    };

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('User profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Main handler - routes to sub-handlers based on URL
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subRoute = getSubRoute(req);

  if (subRoute.startsWith('city/')) {
    return handleCity(req, res);
  } else if (subRoute.startsWith('cluster/')) {
    return handleCluster(req, res);
  } else if (subRoute.startsWith('employee-details/')) {
    return handleEmployeeDetails(req, res);
  } else if (subRoute.startsWith('my-rank/')) {
    return handleMyRank(req, res);
  } else if (subRoute.startsWith('profile/')) {
    return handleProfile(req, res);
  } else {
    return res.status(404).json({ error: 'Not found' });
  }
}
