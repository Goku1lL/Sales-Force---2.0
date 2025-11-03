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

router.get('/summary', async (req, res, next) => {
  try {
    const employeeId = req.query.employeeId as string;
    if (!employeeId || employeeId.trim() === '') return res.status(400).json({ message: 'employeeId is required' });
    const prisma = getPrisma();

    const today = new Date().toISOString().slice(0, 10);

    // Get daily achievements separately (grouped by metric to avoid duplication)
    // Exclude AB and NOB metrics (they're weekly-only)
    const dailyAchievementsRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, SUM(Achievement) as achievement, SUM(variable_pay) as variable_pay
       FROM DayAchievement 
       WHERE employee_id = ? AND date = ? AND deleted = 0
       AND metric NOT LIKE '%AB%' AND metric NOT LIKE '%NOB%'
       GROUP BY metric`,
      employeeId, today
    );

    // Get employee's base variable pay
    const employeeData = await prisma.$queryRawUnsafe<any[]>(
      `SELECT variable_pay FROM Executive WHERE employee_id = ? AND deleted = 0 LIMIT 1`,
      employeeId
    );

    const monthlyVariablePay = Number(employeeData[0]?.variable_pay || 0);
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

    // Create achievement lookup map
    const dailyAchievementMap = dailyAchievementsRaw.reduce((map: Record<string, any>, item) => {
      map[item.metric] = {
        achievement: Number(item.achievement || 0),
        variable_pay: Number(item.variable_pay || 0)
      };
      return map;
    }, {});

    // Get daily targets with all slabs
    // Exclude AB and NOB metrics from daily targets (they're weekly-only)
    const dailyTargets = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, target, slab_Segment, incentive_percent, contribution
       FROM DayTargets
       WHERE employee_id = ? AND date = ? AND deleted = 0
       AND metric NOT LIKE '%AB%' AND metric NOT LIKE '%NOB%'
       ORDER BY metric, slab_Segment`,
      employeeId, today
    );

    // Get eligibility metric for daily period (exclude AB and NOB metrics)
    const dailyEligibilityMetric = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, MAX(target) as maxTarget
       FROM DayTargets
       WHERE employee_id = ? AND date = ? AND eligibility = 1 AND deleted = 0
       AND metric NOT LIKE '%AB%' AND metric NOT LIKE '%NOB%'
       GROUP BY metric
       LIMIT 1`,
      employeeId, today
    );

    // Check daily eligibility achievement status
    let dailyEligibilityStatus = null;
    if (dailyEligibilityMetric.length > 0) {
      const eligMetric = dailyEligibilityMetric[0];
      const achievement = dailyAchievementMap[eligMetric.metric]?.achievement || 0;
      const target = Number(eligMetric.maxTarget || 0);
      dailyEligibilityStatus = {
        metric: eligMetric.metric,
        target: target,
        achievement: achievement,
        isEligible: achievement >= target
      };
    }

    // Group targets by metric and calculate totals properly
    const metricGroups = dailyTargets.reduce((groups: Record<string, any>, row) => {
      const metric = row.metric;
      if (!groups[metric]) {
        groups[metric] = {
          metric,
          totalAchievement: dailyAchievementMap[metric]?.achievement || 0,
          targets: [],
          totalTarget: 0,
          totalEarnings: 0,
          contribution: Number(row.contribution || 1)
        };
      }
      
      // Store targets with their slab info
      groups[metric].targets.push({
        slab: row.slab_Segment,
        target: Number(row.target || 0),
        incentive_percent: Number(row.incentive_percent || 0)
      });
      
      // Use highest target (highest slab)
      groups[metric].totalTarget = Math.max(groups[metric].totalTarget, Number(row.target || 0));
      
      return groups;
    }, {});

    // Calculate earnings for each metric group
    Object.keys(metricGroups).forEach(metricName => {
      const group = metricGroups[metricName];
      const achievement = group.totalAchievement;
      const contribution = group.contribution;
      
      // Determine slab multiplier
      const slabMultiplier = getSlabMultiplier(achievement, group.targets);
      
      // Calculate earnings
      const metricBasePay = dailyBasePay * contribution;
      const achievementRatio = group.totalTarget > 0 ? achievement / group.totalTarget : 0;
      const earned = metricBasePay * achievementRatio * slabMultiplier;
      
      group.totalEarnings = earned;
    });

    // Calculate total achievements and targets across all metrics
    const todayAchievement = Object.values(metricGroups).reduce((sum: number, group: any) => sum + group.totalAchievement, 0);
    const todayTargetUnits = Object.values(metricGroups).reduce((sum: number, group: any) => sum + group.totalTarget, 0);
    let todayEarnings = Object.values(metricGroups).reduce((sum: number, group: any) => sum + group.totalEarnings, 0);

    // Calculate potential earnings based on earning rates per unit
    // AB: ₹10/unit, GT OC: ₹50/unit, Fruits OC: ₹100/unit
    const todayPotentialEarnings = Object.values(metricGroups).reduce((total, group: any) => {
      const target = group.totalTarget; // Use highest slab target
      let rate = 0;
      if (group.metric === 'AB') rate = 10;
      else if (group.metric === 'GT OC') rate = 50;
      else if (group.metric === 'Fruits OC') rate = 100;
      else if (group.metric === 'Fruits AB') rate = 100; // Add Fruits AB rate
      return total + (target * rate);
    }, 0);

    // Calculate current yearweek from today's date
    const currentYearweek = getCurrentYearweek();

    // Get weekly achievements separately (grouped by metric to avoid duplication)
    const weeklyAchievementsRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, SUM(Achievement) as achievement, SUM(variable_pay) as variable_pay
       FROM WeekAchievement 
       WHERE employee_id = ? AND yearweek = ? AND deleted = 0
       GROUP BY metric`,
      employeeId, currentYearweek
    );

    // Create weekly achievement lookup map first (needed for eligibility check)
    const weeklyAchievementMap = weeklyAchievementsRaw.reduce((map: Record<string, any>, item) => {
      map[item.metric] = {
        achievement: Number(item.achievement || 0),
        variable_pay: Number(item.variable_pay || 0)
      };
      return map;
    }, {});

    // Get weekly targets with all slabs
    const weeklyTargets = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, target, slab_Segment, incentive_percent, contribution
       FROM WeekTargets
       WHERE employee_id = ? AND yearweek = ? AND deleted = 0
       ORDER BY metric, slab_Segment`,
      employeeId, currentYearweek
    );

    // Get eligibility metric for weekly period
    const weeklyEligibilityMetric = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, MAX(target) as maxTarget
       FROM WeekTargets
       WHERE employee_id = ? AND yearweek = ? AND eligibility = 1 AND deleted = 0
       GROUP BY metric
       LIMIT 1`,
      employeeId, currentYearweek
    );

    // Check weekly eligibility achievement status
    let weeklyEligibilityStatus = null;
    if (weeklyEligibilityMetric.length > 0) {
      const eligMetric = weeklyEligibilityMetric[0];
      const achievement = weeklyAchievementMap[eligMetric.metric]?.achievement || 0;
      const target = Number(eligMetric.maxTarget || 0);
      weeklyEligibilityStatus = {
        metric: eligMetric.metric,
        target: target,
        achievement: achievement,
        isEligible: achievement >= target
      };
    }

    // Group weekly targets by metric and calculate totals properly
    const weeklyMetricGroups = weeklyTargets.reduce((groups: Record<string, any>, row) => {
      const metric = row.metric;
      if (!groups[metric]) {
        groups[metric] = {
          metric,
          totalAchievement: weeklyAchievementMap[metric]?.achievement || 0,
          totalTarget: 0,
          totalEarnings: 0,
          contribution: Number(row.contribution || 1),
          targets: []
        };
      }
      
      // Store targets with their slab info
      groups[metric].targets.push({
        slab: row.slab_Segment,
        target: Number(row.target || 0),
        incentive_percent: Number(row.incentive_percent || 0)
      });
      
      // Use highest target (highest slab)
      groups[metric].totalTarget = Math.max(groups[metric].totalTarget, Number(row.target || 0));
      
      return groups;
    }, {});

    // Calculate earnings for each weekly metric group
    Object.keys(weeklyMetricGroups).forEach(metricName => {
      const group = weeklyMetricGroups[metricName];
      const achievement = group.totalAchievement;
      const contribution = group.contribution;
      
      // Determine slab multiplier
      const slabMultiplier = getSlabMultiplier(achievement, group.targets);
      
      // Calculate earnings
      const metricBasePay = weeklyBasePay * contribution;
      const achievementRatio = group.totalTarget > 0 ? achievement / group.totalTarget : 0;
      const earned = metricBasePay * achievementRatio * slabMultiplier;
      
      group.totalEarnings = earned;
    });

    // Use calculated current yearweek (already set above)

    let bonusMap: Record<string, any> = {};
    let bonusTiersMap: Record<string, any[]> = {};
    
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
      bonusMap = bonusData.reduce((map: Record<string, any>, item) => {
        map[item.metric] = {
          rank: Number(item.rank),
          bonusAmount: Number(item.bonus_achievement || 0)
        };
        return map;
      }, {});

      // Query bonus tier configuration for all metrics in weeklyMetricGroups
      const metricsList = Object.keys(weeklyMetricGroups);
      if (metricsList.length > 0) {
        const placeholders = metricsList.map(() => '?').join(',');
        const bonusTiersData = await prisma.$queryRawUnsafe<any[]>(
          `SELECT metric, start_rank, end_rank, bonus_percent, target
           FROM SA_Bonus
           WHERE metric IN (${placeholders}) AND steps = 'week' AND deleted = 0
           ORDER BY metric, start_rank`,
          ...metricsList
        );

        // Group tiers by metric
        bonusTiersMap = bonusTiersData.reduce((map: Record<string, any[]>, item) => {
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
      const bonus = bonusMap[metricName];
      const bonusTiers = bonusTiersMap[metricName] || [];
      
      if (bonus) {
        // Add bonus to total earnings
        group.totalEarnings = group.totalEarnings + bonus.bonusAmount;
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

    // Calculate total achievements and targets across all metrics
    const weeklyAchievement = Object.values(weeklyMetricGroups).reduce((sum: number, group: any) => sum + group.totalAchievement, 0);
    const weeklyTargetUnits = Object.values(weeklyMetricGroups).reduce((sum: number, group: any) => sum + group.totalTarget, 0);
    let weeklyEarnings = Object.values(weeklyMetricGroups).reduce((sum: number, group: any) => sum + group.totalEarnings, 0);

    // Calculate potential earnings based on earning rates per unit
    // AB: ₹10/unit, GT OC: ₹50/unit, Fruits OC: ₹100/unit
    const weeklyPotentialEarnings = Object.values(weeklyMetricGroups).reduce((total, group: any) => {
      const target = group.totalTarget; // Use highest slab target
      let rate = 0;
      if (group.metric === 'AB') rate = 10;
      else if (group.metric === 'GT OC') rate = 50;
      else if (group.metric === 'Fruits OC') rate = 100;
      else if (group.metric === 'Fruits AB') rate = 100; // Add Fruits AB rate
      return total + (target * rate);
    }, 0);

    const dailyPercent = todayTargetUnits > 0 ? (todayAchievement / todayTargetUnits) * 100 : 0;
    const weeklyPercent = weeklyTargetUnits > 0 ? (weeklyAchievement / weeklyTargetUnits) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        date: today,
        // Performance data (units)
        todayTargetUnits: todayTargetUnits,
        todayAchievementUnits: todayAchievement,
        weeklyTargetUnits: weeklyTargetUnits,
        weeklyAchievementUnits: weeklyAchievement,
        // Performance percentages
        dailyPercent,
        weeklyPercent,
        // Earnings data (rupees)
        todayEarnings,
        weeklyEarnings,
        // Potential earnings (what they could earn if they hit 100% targets)
        todayPotentialEarnings,
        weeklyPotentialEarnings,
        // Legacy fields for backward compatibility (now show potential earnings)
        todayTarget: todayPotentialEarnings,
        weeklyTarget: weeklyPotentialEarnings,
        // Eligibility status
        dailyEligibilityStatus,
        weeklyEligibilityStatus,
      }
    });
  } catch (err) { next(err); }
});

router.get('/live-activity', authMiddleware, async (_req, res, next) => {
  try {
    const prisma = getPrisma();

    // Get recent sales achievements from today
    const today = new Date().toISOString().slice(0, 10);

    const recentAchievements = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        da.employee_id,
        da.Achievement,
        da.variable_pay,
        da.date,
        da.metric,
        da.unit,
        e.Name as employee_name,
        e.cluster,
        e.role
      FROM DayAchievement da
      JOIN Executive e ON da.employee_id = e.employee_id
      WHERE da.date >= ?
        AND da.Achievement > 0
        AND da.deleted = 0
      ORDER BY da.date DESC, da.Achievement DESC
      LIMIT 20
    `, today);

    // Format the activities
    const activities = recentAchievements.map((achievement: any) => ({
      id: `${achievement.employee_id}_${achievement.date}_${achievement.metric}`,
      message: `${achievement.employee_name} achieved ${achievement.Achievement}${achievement.unit ? ' ' + achievement.unit : ''} in ${achievement.metric}`,
      employee_name: achievement.employee_name,
      cluster: achievement.cluster,
      metric: achievement.metric,
      achievement: achievement.Achievement,
      unit: achievement.unit,
      variable_pay: achievement.variable_pay,
      date: achievement.date,
      timestamp: new Date(achievement.date).toLocaleTimeString()
    }));

    res.json({ status: 'success', data: activities });
  } catch (err) { next(err); }
});

router.get('/urgent-actions', async (req, res, next) => {
  try {
    const employeeId = String(req.query.employeeId || '');
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });
    const prisma = getPrisma();

    // For now, return empty array since we don't have direct employee-customer relationship
    const rows: any[] = [];

    const now = Date.now();
    const actions = rows.map((r) => {
      const last = r.last_order_date ? new Date(r.last_order_date).getTime() : 0;
      const days = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 999;
      const priority = days > 21 ? 'critical' : days > 14 ? 'high' : 'medium';
      return { customer: r.name, reason: `No order for ${days} days`, priority };
    });

    res.json({ status: 'success', data: actions });
  } catch (err) { next(err); }
});

router.get('/nearby-opportunities', async (_req, res, next) => {
  try {
    // Placeholder from DB; real geo requires locality polygons usage
    const prisma = getPrisma();
    // For now, return empty array since we don't have direct employee-customer relationship
    const rows: any[] = [];
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

export default router;
