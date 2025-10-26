import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

// Get user profile with cluster, city and ranking info
router.get('/profile/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const prisma = getPrisma();
    
    // Get employee info from Executive table with city info
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT e.Id, e.Name, e.cluster, e.CityId, cd.City as city_name
       FROM Executive e
       LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
       WHERE e.employee_id = ? AND e.deleted = 0 LIMIT 1`,
      employeeId.toString()
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const emp = employee[0];
    const cluster = emp.cluster || 'Unknown';
    const city = emp.city_name || 'Unknown';

            // Calculate current week ranking based on weekly achievements for cluster
    const currentWeekRanking = await prisma.$queryRawUnsafe<any[]>(
      `SELECT @rank := @rank + 1 as rank, t.*
       FROM (
         SELECT
           e.employee_id,
           e.Name,
           e.cluster,
                   COALESCE(SUM(wa.Achievement), 0) as weekly_achievements
         FROM Executive e
         LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id
           AND wa.deleted = 0
           AND wa.yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE deleted = 0)
         WHERE e.deleted = 0 AND e.cluster = ?
         GROUP BY e.employee_id, e.Name, e.cluster
                     ORDER BY weekly_achievements DESC
       ) t
       CROSS JOIN (SELECT @rank := 0) r`,
      cluster
    );

    // Calculate city ranking
    const cityRanking = await prisma.$queryRawUnsafe<any[]>(
      `SELECT @rank := @rank + 1 as rank, t.*
       FROM (
         SELECT
           e.employee_id,
           e.Name,
           e.CityId,
           cd.City as city_name,
                   COALESCE(SUM(wa.Achievement), 0) as weekly_achievements
         FROM Executive e
         LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
         LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id
           AND wa.deleted = 0
           AND wa.yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE deleted = 0)
         WHERE e.deleted = 0 AND e.CityId = ?
         GROUP BY e.employee_id, e.Name, e.CityId, cd.City
                     ORDER BY weekly_achievements DESC
       ) t
       CROSS JOIN (SELECT @rank := 0) r`,
      emp.CityId
    );

    const userClusterRank = currentWeekRanking.find(r => r.employee_id === employeeId.toString());
    const userCityRank = cityRanking.find(r => r.employee_id === employeeId.toString());
    
    
    const clusterRank = userClusterRank ? Number(userClusterRank.rank) : null;
    const cityRank = userCityRank ? Number(userCityRank.rank) : null;

    res.json({ 
      status: 'success', 
      data: {
        employee_id: employeeId,
        name: emp.Name,
        cluster: cluster,
        city: city,
        CityId: emp.CityId,
        cluster_rank: clusterRank,
        city_rank: cityRank,
        total_in_cluster: currentWeekRanking.length,
        total_in_city: cityRanking.length
      }
    });
  } catch (err) { 
    console.error('Profile fetch error:', err);
    next(err); 
  }
});

router.get('/cluster/:cluster', authMiddleware, async (req, res, next) => {
  try {
    const { cluster } = req.params;
    const prisma = getPrisma();

        // Get cluster leaderboard based on weekly achievements
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT @rank := @rank + 1 as rank, t.*
           FROM (
             SELECT
               e.employee_id,
               e.Name,
               e.cluster,
               COALESCE(SUM(wa.Achievement), 0) as weekly_achievements
             FROM Executive e
             LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id
               AND wa.deleted = 0
               AND wa.yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE deleted = 0)
             WHERE e.deleted = 0 AND e.cluster = ?
             GROUP BY e.employee_id, e.Name, e.cluster
             ORDER BY weekly_achievements DESC
             LIMIT 100
           ) t
           CROSS JOIN (SELECT @rank := 0) r`,
          cluster
        );
    
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/city/:cityId', authMiddleware, async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const prisma = getPrisma();
    
        // Get city leaderboard based on weekly achievements
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT @rank := @rank + 1 as rank, t.*
           FROM (
             SELECT
               e.employee_id,
               e.Name,
               e.CityId,
               cd.City as city_name,
               COALESCE(SUM(wa.Achievement), 0) as weekly_achievements
             FROM Executive e
             LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
             LEFT JOIN WeekAchievement wa ON e.employee_id = wa.employee_id
               AND wa.deleted = 0
               AND wa.yearweek = (SELECT MAX(yearweek) FROM WeekTargets WHERE deleted = 0)
             WHERE e.deleted = 0 AND e.CityId = ?
             GROUP BY e.employee_id, e.Name, e.CityId, cd.City
             ORDER BY weekly_achievements DESC
             LIMIT 100
           ) t
           CROSS JOIN (SELECT @rank := 0) r`,
          cityId
        );
    
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/my-rank/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const prisma = getPrisma();

    // Get employee cluster first
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cluster FROM Executive WHERE employee_id = ? AND deleted = 0 LIMIT 1`,
      employeeId.toString()
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const cluster = employee[0].cluster || 'Unknown';

        // Calculate ranking within cluster
        const clusterRanking = await prisma.$queryRawUnsafe<any[]>(
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

    const userRank = clusterRanking.find(r => r.employee_id === employeeId.toString());
    const rank = userRank ? Number(userRank.rank) : null;

    res.json({
      status: 'success',
      data: {
        employee_id: employeeId,
        cluster: cluster,
        Ranking: rank,
        total_in_cluster: clusterRanking.length
      }
    });
  } catch (err) { next(err); }
});

// Get detailed metrics for a specific employee
router.get('/employee-details/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId; // Keep as string since employee_ids can be alphanumeric
    const prisma = getPrisma();

    // Get employee basic info
    const employee = await prisma.$queryRawUnsafe<any[]>(
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
    const dailyAchievements = await prisma.$queryRawUnsafe<any[]>(
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
    // Since WeekAchievement table is empty, we'll get targets for the current week
    const currentYearWeek = Math.floor(new Date().getTime() / 1000 / 60 / 60 / 24 / 7) + 202400; // Rough calculation
    const weeklyAchievements = await prisma.$queryRawUnsafe<any[]>(
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
  } catch (err) {
    console.error('Employee details fetch error:', err);
    next(err);
  }
});

export default router;
