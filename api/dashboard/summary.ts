import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId || typeof employeeId !== 'string') {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Get daily targets and achievements
    const dailyData = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        dt.metric,
        dt.target,
        COALESCE(da.Achievement, 0) as achievement,
        COALESCE(da.variable_pay, 0) as variable_pay
       FROM DayTargets dt
       LEFT JOIN DayAchievement da ON dt.employee_id = da.employee_id
         AND dt.date = da.date
         AND dt.metric = da.metric
         AND da.deleted = 0
       WHERE dt.employee_id = ? AND dt.date = ? AND dt.deleted = 0`,
      employeeId, today
    );

    // Calculate performance-based percentages
    const todayAchievement = dailyData.reduce((a, r) => a + Number(r.achievement || 0), 0);
    const todayTargetUnits = dailyData.reduce((a, r) => a + Number(r.target || 0), 0);
    let todayEarnings = dailyData.reduce((a, r) => a + Number(r.variable_pay || 0), 0);

    // Calculate potential earnings based on earning rates per unit
    const todayPotentialEarnings = dailyData.reduce((total, r) => {
      const target = Number(r.target || 0);
      let rate = 0;
      if (r.metric === 'AB') rate = 10;
      else if (r.metric === 'GT OC') rate = 50;
      else if (r.metric === 'Fruits OC') rate = 100;
      return total + (target * rate);
    }, 0);

    // Get weekly targets and achievements
    const weeklyData = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        wt.metric,
        wt.target,
        COALESCE(wa.Achievement, 0) as achievement,
        COALESCE(wa.variable_pay, 0) as variable_pay
       FROM WeekTargets wt
       LEFT JOIN WeekAchievement wa ON wt.employee_id = wa.employee_id
         AND wt.yearweek = wa.yearweek
         AND wt.metric = wa.metric
         AND wa.deleted = 0
       WHERE wt.employee_id = ? AND wt.yearweek = YEARWEEK(NOW()) AND wt.deleted = 0`,
      employeeId
    );

    const weeklyAchievement = weeklyData.reduce((a, r) => a + Number(r.achievement || 0), 0);
    const weeklyTargetUnits = weeklyData.reduce((a, r) => a + Number(r.target || 0), 0);
    let weeklyEarnings = weeklyData.reduce((a, r) => a + Number(r.variable_pay || 0), 0);

    const weeklyPotentialEarnings = weeklyData.reduce((total, r) => {
      const target = Number(r.target || 0);
      let rate = 0;
      if (r.metric === 'AB') rate = 10;
      else if (r.metric === 'GT OC') rate = 50;
      else if (r.metric === 'Fruits OC') rate = 100;
      return total + (target * rate);
    }, 0);

    // Calculate percentages
    const dailyPercent = todayTargetUnits > 0 ? (todayAchievement / todayTargetUnits) * 100 : 0;
    const weeklyPercent = weeklyTargetUnits > 0 ? (weeklyAchievement / weeklyTargetUnits) * 100 : 0;

    const summary = {
      dailyPercent: Math.round(dailyPercent * 100) / 100,
      weeklyPercent: Math.round(weeklyPercent * 100) / 100,
      todayTarget: todayTargetUnits,
      todayAchievement,
      todayEarnings,
      todayPotentialEarnings,
      weeklyTarget: weeklyTargetUnits,
      weeklyAchievement,
      weeklyEarnings,
      weeklyPotentialEarnings,
    };

    res.status(200).json({ data: summary });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
