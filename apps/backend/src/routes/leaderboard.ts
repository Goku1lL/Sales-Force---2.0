import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

// Helper function to calculate current yearweek from date
function getCurrentYearweek(date?: Date): string {
  const today = date || new Date();
  const year = today.getFullYear();
  const start = new Date(year, 0, 1);
  const days = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return year + String(week).padStart(2, '0');
}

// Get user profile with cluster, city and ranking info
router.get('/profile/:employeeId', async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const prisma = getPrisma();
    
    // Get employee info from Executive table with city info
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
    const cluster = emp.cluster || 'Unknown';
    const city = emp.city_name || 'Unknown';

    // Calculate current yearweek from today's date
    const currentYearweek = getCurrentYearweek();

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
           AND wa.yearweek = ?
         WHERE e.deleted = 0 AND e.cluster = ?
         GROUP BY e.employee_id, e.Name, e.cluster
                     ORDER BY weekly_achievements DESC
       ) t
       CROSS JOIN (SELECT @rank := 0) r`,
      currentYearweek, cluster
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
           AND wa.yearweek = ?
         WHERE e.deleted = 0 AND e.CityId = ?
         GROUP BY e.employee_id, e.Name, e.CityId, cd.City
                     ORDER BY weekly_achievements DESC
       ) t
       CROSS JOIN (SELECT @rank := 0) r`,
      currentYearweek, emp.CityId
    );

    const userClusterRank = currentWeekRanking.find(r => r.employee_id === employeeId);
    const userCityRank = cityRanking.find(r => r.employee_id === employeeId);
    
    
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

router.get('/cluster/:cluster', async (req, res, next) => {
  try {
    const { cluster } = req.params;
    const period = req.query.period as string || 'week'; // day or week
    const prisma = getPrisma();

        if (period === 'day') {
          // Get cluster leaderboard based on daily achievements percentage
          const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT @rank := @rank + 1 as rank, t.*
             FROM (
               SELECT
                 e.employee_id,
                 e.Name,
                 e.cluster,
                 COALESCE((SELECT SUM(Achievement) FROM DayAchievement WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) as achievement,
                 COALESCE((SELECT MAX(target) FROM DayTargets WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) as target,
                 CASE 
                   WHEN COALESCE((SELECT MAX(target) FROM DayTargets WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) > 0 
                   THEN (COALESCE((SELECT SUM(Achievement) FROM DayAchievement WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) / COALESCE((SELECT MAX(target) FROM DayTargets WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0)) * 100
                   ELSE 0
                 END as achievement_percentage
               FROM Executive e
               WHERE e.deleted = 0 AND e.cluster = ?
               ORDER BY achievement_percentage DESC
               LIMIT 100
             ) t
             CROSS JOIN (SELECT @rank := 0) r`,
            cluster
          );
          res.json({ status: 'success', data: rows });
        } else {
          // Calculate current yearweek from today's date
          const currentYearweek = getCurrentYearweek();
          
          // Get cluster leaderboard based on weekly achievements percentage
          const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT @rank := @rank + 1 as rank, t.*
             FROM (
               SELECT
                 e.employee_id,
                 e.Name,
                 e.cluster,
                 COALESCE((SELECT SUM(Achievement) FROM WeekAchievement WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) as achievement,
                 COALESCE((SELECT MAX(target) FROM WeekTargets WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) as target,
                 CASE 
                   WHEN COALESCE((SELECT MAX(target) FROM WeekTargets WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) > 0 
                   THEN (COALESCE((SELECT SUM(Achievement) FROM WeekAchievement WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) / COALESCE((SELECT MAX(target) FROM WeekTargets WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0)) * 100
                   ELSE 0
                 END as achievement_percentage
               FROM Executive e
               WHERE e.deleted = 0 AND e.cluster = ?
               ORDER BY achievement_percentage DESC
               LIMIT 100
             ) t
             CROSS JOIN (SELECT @rank := 0) r`,
            currentYearweek, currentYearweek, currentYearweek, currentYearweek, currentYearweek, cluster
          );
          res.json({ status: 'success', data: rows });
        }
  } catch (err) { next(err); }
});

router.get('/city/:cityId', authMiddleware, async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const period = req.query.period as string || 'week'; // day or week
    const prisma = getPrisma();
    
    if (period === 'day') {
      // Get city leaderboard based on daily achievements percentage
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT @rank := @rank + 1 as rank, t.*
         FROM (
           SELECT
             e.employee_id,
             e.Name,
             e.CityId,
             cd.City as city_name,
             COALESCE((SELECT SUM(Achievement) FROM DayAchievement WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) as achievement,
             COALESCE((SELECT MAX(target) FROM DayTargets WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) as target,
             CASE 
               WHEN COALESCE((SELECT MAX(target) FROM DayTargets WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) > 0 
               THEN (COALESCE((SELECT SUM(Achievement) FROM DayAchievement WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0) / COALESCE((SELECT MAX(target) FROM DayTargets WHERE employee_id = e.employee_id AND date = CURDATE() AND deleted = 0), 0)) * 100
               ELSE 0
             END as achievement_percentage
           FROM Executive e
           LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
           WHERE e.deleted = 0 AND e.CityId = ?
           ORDER BY achievement_percentage DESC
           LIMIT 100
         ) t
         CROSS JOIN (SELECT @rank := 0) r`,
        cityId
      );
      res.json({ status: 'success', data: rows });
    } else {
      // Calculate current yearweek from today's date
      const currentYearweek = getCurrentYearweek();
      
      // Get city leaderboard based on weekly achievements percentage
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT @rank := @rank + 1 as rank, t.*
         FROM (
           SELECT
             e.employee_id,
             e.Name,
             e.CityId,
             cd.City as city_name,
             COALESCE((SELECT SUM(Achievement) FROM WeekAchievement WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) as achievement,
             COALESCE((SELECT MAX(target) FROM WeekTargets WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) as target,
             CASE 
               WHEN COALESCE((SELECT MAX(target) FROM WeekTargets WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) > 0 
               THEN (COALESCE((SELECT SUM(Achievement) FROM WeekAchievement WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0) / COALESCE((SELECT MAX(target) FROM WeekTargets WHERE employee_id = e.employee_id AND yearweek = ? AND deleted = 0), 0)) * 100
               ELSE 0
             END as achievement_percentage
           FROM Executive e
           LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
           WHERE e.deleted = 0 AND e.CityId = ?
           ORDER BY achievement_percentage DESC
           LIMIT 100
         ) t
         CROSS JOIN (SELECT @rank := 0) r`,
        currentYearweek, currentYearweek, currentYearweek, currentYearweek, currentYearweek, cityId
      );
      res.json({ status: 'success', data: rows });
    }
  } catch (err) { next(err); }
});

router.get('/my-rank/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const prisma = getPrisma();

    // Get employee cluster first
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cluster FROM Executive WHERE employee_id = ? AND deleted = 0 LIMIT 1`,
      employeeId
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
               AND wa.yearweek = ?
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
        employee_id: employeeId,
        cluster: cluster,
        Ranking: rank,
        total_in_cluster: clusterRanking.length
      }
    });
  } catch (err) { next(err); }
});

// Get detailed metrics for a specific employee
router.get('/employee-details/:employeeId', async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId; // Keep as string since employee_ids can be alphanumeric
    const prisma = getPrisma();

    // Get employee basic info
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT e.Id, e.Name, e.cluster, e.CityId, e.variable_pay, cd.City as city_name
       FROM Executive e
       LEFT JOIN City_Dim cd ON e.CityId = cd.CityId
       WHERE e.employee_id = ? AND e.deleted = 0 LIMIT 1`,
      employeeId
    );

    if (!employee.length) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const emp = employee[0];
    const employeeVariablePay = Number(emp.variable_pay || 0);

    // Get employee's base variable pay
    const monthlyVariablePay = employeeVariablePay;
    const dailyBasePay = monthlyVariablePay / 30;
    const weeklyBasePay = monthlyVariablePay / 4;

    // Function to calculate slab multiplier based on achievement
    function getSlabMultiplier(achievement: number, targets: any[]): number {
      // Sort slabs by target (ascending)
      const sortedSlabs = targets.sort((a, b) => a.target - b.target);
      
      // Find the highest slab reached
      let multiplier = sortedSlabs[0]?.incentive_percent || 1;
      
      for (const slab of sortedSlabs) {
        if (achievement >= slab.target) {
          multiplier = slab.incentive_percent;
        } else {
          break;
        }
      }
      
      return multiplier;
    }

    // Get daily achievements for today
    const today = new Date().toISOString().slice(0, 10);
    
    // Get achievements separately (grouped by metric to avoid duplication)
    const dailyAchievementsRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, SUM(Achievement) as achievement, SUM(variable_pay) as achievement_earnings
       FROM DayAchievement 
       WHERE employee_id = ? AND date = ? AND deleted = 0
       GROUP BY metric`,
      employeeId, today
    );

    // Get targets with all slabs
    const dailyTargets = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, target, incentive_percent, slab_Segment, contribution
       FROM DayTargets
       WHERE employee_id = ? AND date = ? AND deleted = 0
       ORDER BY metric, slab_Segment`,
      employeeId, today
    );

    // Calculate current yearweek from today's date
    const currentYearweek = getCurrentYearweek();

    // Get weekly achievements for current week
    const weeklyAchievementsRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, SUM(Achievement) as achievement, SUM(variable_pay) as achievement_earnings
       FROM WeekAchievement 
       WHERE employee_id = ? AND yearweek = ? AND deleted = 0
       GROUP BY metric`,
      employeeId, currentYearweek
    );

    // Get weekly targets with all slabs
    const weeklyTargets = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, target, incentive_percent, slab_Segment, contribution
       FROM WeekTargets
       WHERE employee_id = ? AND yearweek = ? AND deleted = 0
       ORDER BY metric, slab_Segment`,
      employeeId, currentYearweek
    );

    // Create achievement lookup maps
    const dailyAchievementMap = dailyAchievementsRaw.reduce((map: Record<string, any>, item) => {
      map[item.metric] = {
        achievement: Number(item.achievement || 0),
        earnings: Number(item.achievement_earnings || 0)
      };
      return map;
    }, {});

    const weeklyAchievementMap = weeklyAchievementsRaw.reduce((map: Record<string, any>, item) => {
      map[item.metric] = {
        achievement: Number(item.achievement || 0),
        earnings: Number(item.achievement_earnings || 0)
      };
      return map;
    }, {});

    // Group targets by metric and calculate totals
    const dailyMetricGroups = dailyTargets.reduce((groups: Record<string, any>, item) => {
      const metric = item.metric;
      if (!groups[metric]) {
        groups[metric] = {
          achievement: dailyAchievementMap[metric]?.achievement || 0,
          target: 0,
          earnings: 0,
          contribution: Number(item.contribution || 1),
          targets: []
        };
      }
      
      // Store targets with their slab info
      groups[metric].targets.push({
        slab: item.slab_Segment,
        target: Number(item.target || 0),
        incentive_percent: Number(item.incentive_percent || 0)
      });
      
      // Use highest target (highest slab)
      groups[metric].target = Math.max(groups[metric].target, Number(item.target || 0));
      
      return groups;
    }, {});

    // Calculate earnings for each daily metric group
    Object.keys(dailyMetricGroups).forEach(metricName => {
      const group = dailyMetricGroups[metricName];
      const achievement = group.achievement;
      const contribution = group.contribution;
      
      // Determine slab multiplier
      const slabMultiplier = getSlabMultiplier(achievement, group.targets);
      
      // Calculate earnings
      const metricBasePay = dailyBasePay * contribution;
      const achievementRatio = group.target > 0 ? achievement / group.target : 0;
      const earned = metricBasePay * achievementRatio * slabMultiplier;
      
      group.earnings = earned;
    });

    const weeklyMetricGroups = weeklyTargets.reduce((groups: Record<string, any>, item) => {
      const metric = item.metric;
      if (!groups[metric]) {
        groups[metric] = {
          achievement: weeklyAchievementMap[metric]?.achievement || 0,
          target: 0,
          earnings: 0,
          contribution: Number(item.contribution || 1),
          targets: []
        };
      }
      
      // Store targets with their slab info
      groups[metric].targets.push({
        slab: item.slab_Segment,
        target: Number(item.target || 0),
        incentive_percent: Number(item.incentive_percent || 0)
      });
      
      // Use highest target (highest slab)
      groups[metric].target = Math.max(groups[metric].target, Number(item.target || 0));
      
      return groups;
    }, {});

    // Calculate earnings for each weekly metric group
    Object.keys(weeklyMetricGroups).forEach(metricName => {
      const group = weeklyMetricGroups[metricName];
      const achievement = group.achievement;
      const contribution = group.contribution;
      
      // Determine slab multiplier
      const slabMultiplier = getSlabMultiplier(achievement, group.targets);
      
      // Calculate earnings
      const metricBasePay = weeklyBasePay * contribution;
      const achievementRatio = group.target > 0 ? achievement / group.target : 0;
      const earned = metricBasePay * achievementRatio * slabMultiplier;
      
      group.earnings = earned;
    });

    // Query rank-based bonus data from SA_EmployeeBonus table for weekly metrics
    let weeklyBonusMap: Record<string, any> = {};
    let weeklyBonusTiersMap: Record<string, any[]> = {};
    
    if (currentYearweek) {
      const bonusData = await prisma.$queryRawUnsafe<any[]>(
        `SELECT metric, rank, bonus_achievement
         FROM SA_EmployeeBonus
         WHERE employee_id = ? 
           AND steps = 'week'
           AND steps_value = ?
           AND deleted = 0`,
        employeeId,
        currentYearweek
      );

      // Create bonus lookup map by metric
      weeklyBonusMap = bonusData.reduce((map: Record<string, any>, item) => {
        map[item.metric] = {
          rank: Number(item.rank),
          bonusAmount: Number(item.bonus_achievement || 0)
        };
        return map;
      }, {});

      // Query bonus tier configuration for all weekly metrics
      const weeklyMetricsList = Object.keys(weeklyMetricGroups);
      if (weeklyMetricsList.length > 0) {
        const placeholders = weeklyMetricsList.map(() => '?').join(',');
        const bonusTiersData = await prisma.$queryRawUnsafe<any[]>(
          `SELECT metric, start_rank, end_rank, bonus_percent, target
           FROM SA_Bonus
           WHERE metric IN (${placeholders}) AND steps = 'week' AND deleted = 0
           ORDER BY metric, start_rank`,
          ...weeklyMetricsList
        );

        // Group tiers by metric
        weeklyBonusTiersMap = bonusTiersData.reduce((map: Record<string, any[]>, item) => {
          if (!map[item.metric]) {
            map[item.metric] = [];
          }
          map[item.metric].push({
            startRank: Number(item.start_rank),
            endRank: Number(item.end_rank),
            bonusPercent: Number(item.bonus_percent),
            multiplier: Number(item.bonus_percent), // 2 = 200%, 1.5 = 150%, 1 = 100%
            target: Number(item.target || 0)
          });
          return map;
        }, {});
      }
    }

    // Merge bonus data with weekly metric groups
    Object.keys(weeklyMetricGroups).forEach(metricName => {
      const group = weeklyMetricGroups[metricName];
      const bonus = weeklyBonusMap[metricName];
      const bonusTiers = weeklyBonusTiersMap[metricName] || [];
      
      if (bonus) {
        // Add bonus to earnings
        group.earnings = group.earnings + bonus.bonusAmount;
        group.rankBonus = {
          rank: bonus.rank,
          bonusAmount: bonus.bonusAmount
        };
      }
      
      // Add bonus tier configuration for motivational display
      if (bonusTiers.length > 0) {
        group.bonusTiers = bonusTiers;
      }
    });

    // Calculate totals
    const dailyTotal = {
      achievement: Object.values(dailyMetricGroups).reduce((sum: number, group: any) => sum + group.achievement, 0),
      target: Object.values(dailyMetricGroups).reduce((sum: number, group: any) => sum + group.target, 0),
      earnings: Object.values(dailyMetricGroups).reduce((sum: number, group: any) => sum + group.earnings, 0)
    };

    // Calculate weekly totals (earnings already includes bonus from merge above)
    const weeklyTotal = {
      achievement: Object.values(weeklyMetricGroups).reduce((sum: number, group: any) => sum + group.achievement, 0),
      target: Object.values(weeklyMetricGroups).reduce((sum: number, group: any) => sum + group.target, 0),
      earnings: Object.values(weeklyMetricGroups).reduce((sum: number, group: any) => sum + group.earnings, 0)
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
          metrics: dailyTargets.map(target => {
            const achievement = dailyAchievementMap[target.metric];
            const metricGroup = dailyMetricGroups[target.metric];
            return {
              metric: target.metric,
              slab_Segment: target.slab_Segment,
              achievement: achievement?.achievement || 0,
              target: Number(target.target || 0),
              earnings: metricGroup?.earnings || 0,
              contribution: Number(target.contribution || 0),
              incentive_percent: Number(target.incentive_percent || 0),
              achievement_percentage: target.target > 0 ? ((achievement?.achievement || 0) / target.target * 100) : 0
            };
          }),
          totals: dailyTotal,
          employee_variable_pay: employeeVariablePay
        },
        weekly: {
          metrics: weeklyTargets.map(target => {
            const achievement = weeklyAchievementMap[target.metric];
            const metricGroup = weeklyMetricGroups[target.metric];
            const bonus = weeklyBonusMap[target.metric];
            const bonusTiers = weeklyBonusTiersMap[target.metric] || [];
            return {
              metric: target.metric,
              slab_Segment: target.slab_Segment,
              achievement: achievement?.achievement || 0,
              target: Number(target.target || 0),
              earnings: metricGroup?.earnings || 0,
              contribution: Number(target.contribution || 0),
              incentive_percent: Number(target.incentive_percent || 0),
              achievement_percentage: target.target > 0 ? ((achievement?.achievement || 0) / target.target * 100) : 0,
              ...(bonus && {
                rankBonus: {
                  rank: bonus.rank,
                  bonusAmount: bonus.bonusAmount
                }
              }),
              ...(bonusTiers.length > 0 && {
                bonusTiers: bonusTiers
              })
            };
          }),
          totals: weeklyTotal,
          employee_variable_pay: employeeVariablePay
        }
      }
    });
  } catch (err) {
    console.error('Employee details fetch error:', err);
    next(err);
  }
});

export default router;
