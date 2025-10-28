import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/summary', async (req, res, next) => {
  try {
    const employeeId = req.query.employeeId as string;
    if (!employeeId || employeeId.trim() === '') return res.status(400).json({ message: 'employeeId is required' });
    const prisma = getPrisma();

    const today = new Date().toISOString().slice(0, 10);

    // Get daily targets and achievements - start with targets to ensure we always get them
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
         AND dt.slab_Segment = da.slab_Segment
         AND da.deleted = 0
       WHERE dt.employee_id = ? AND dt.date = ? AND dt.deleted = 0`,
      employeeId, today
    );

    // Debug logging
    console.log('Daily data for employee', employeeId, ':', JSON.stringify(dailyData, null, 2));
    
    // Calculate performance-based percentages (achievement vs target in units)
    const todayAchievement = dailyData.reduce((a, r) => a + Number(r.achievement || 0), 0);
    const todayTargetUnits = dailyData.reduce((a, r) => a + Number(r.target || 0), 0);
    let todayEarnings = dailyData.reduce((a, r) => a + Number(r.variable_pay || 0), 0);

    // Calculate potential earnings based on earning rates per unit
    // AB: ₹10/unit, GT OC: ₹50/unit, Fruits OC: ₹100/unit
    const todayPotentialEarnings = dailyData.reduce((total, r) => {
      const target = Number(r.target || 0);
      let rate = 0;
      if (r.metric === 'AB') rate = 10;
      else if (r.metric === 'GT OC') rate = 50;
      else if (r.metric === 'Fruits OC') rate = 100;
      return total + (target * rate);
    }, 0);

    // Get weekly targets and achievements - start with targets to ensure we always get them
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
         AND wt.slab_Segment = wa.slab_Segment
         AND wa.deleted = 0
       WHERE wt.employee_id = ? AND wt.yearweek = (
         SELECT MAX(yearweek) FROM WeekTargets WHERE employee_id = ? AND deleted = 0
       ) AND wt.deleted = 0`,
      employeeId, employeeId
    );

    // Debug logging
    console.log('Weekly data for employee', employeeId, ':', JSON.stringify(weeklyData, null, 2));
    
    // Calculate performance-based percentages (achievement vs target in units)
    const weeklyAchievement = weeklyData.reduce((a, r) => a + Number(r.achievement || 0), 0);
    const weeklyTargetUnits = weeklyData.reduce((a, r) => a + Number(r.target || 0), 0);
    let weeklyEarnings = weeklyData.reduce((a, r) => a + Number(r.variable_pay || 0), 0);

    // Calculate potential earnings based on earning rates per unit
    // AB: ₹10/unit, GT OC: ₹50/unit, Fruits OC: ₹100/unit
    const weeklyPotentialEarnings = weeklyData.reduce((total, r) => {
      const target = Number(r.target || 0);
      let rate = 0;
      if (r.metric === 'AB') rate = 10;
      else if (r.metric === 'GT OC') rate = 50;
      else if (r.metric === 'Fruits OC') rate = 100;
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
