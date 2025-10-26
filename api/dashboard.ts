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
    if (url?.includes('/summary')) {
      return await handleSummary(req, res);
    } else if (url?.includes('/live-activity')) {
      return await handleLiveActivity(req, res);
    } else if (url?.includes('/urgent-actions')) {
      return await handleUrgentActions(req, res);
    } else if (url?.includes('/nearby-opportunities')) {
      return await handleNearbyOpportunities(req, res);
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

async function handleSummary(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  const prisma = getPrisma();
  const today = new Date().toISOString().slice(0, 10);
  
  const dailyAchievements = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      SUM(Achievement) as total_achievement,
      SUM(variable_pay) as total_variable_pay,
      COUNT(*) as achievement_count
    FROM DayAchievement 
    WHERE employee_id = ? 
      AND date = ? 
      AND deleted = 0
  `, employeeId, today);

  const weeklyAchievements = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      SUM(Achievement) as total_achievement,
      SUM(variable_pay) as total_variable_pay,
      COUNT(*) as achievement_count
    FROM DayAchievement 
    WHERE employee_id = ? 
      AND date >= DATE_SUB(?, INTERVAL 7 DAY)
      AND deleted = 0
  `, employeeId, today);

  const targets = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      daily_target,
      weekly_target
    FROM Targets 
    WHERE employee_id = ?
    LIMIT 1
  `, employeeId);

  const dailyTarget = targets[0]?.daily_target || 100;
  const weeklyTarget = targets[0]?.weekly_target || 500;
  const dailyTotal = dailyAchievements[0]?.total_achievement || 0;
  const weeklyTotal = weeklyAchievements[0]?.total_achievement || 0;
  const dailyPercent = Math.min(100, (dailyTotal / dailyTarget) * 100);
  const weeklyPercent = Math.min(100, (weeklyTotal / weeklyTarget) * 100);

  res.status(200).json({
    success: true,
    data: {
      dailyProgress: dailyTotal,
      weeklyProgress: weeklyTotal,
      dailyPercent: Math.round(dailyPercent),
      weeklyPercent: Math.round(weeklyPercent),
      dailyTarget,
      weeklyTarget,
      dailyVariablePay: dailyAchievements[0]?.total_variable_pay || 0,
      weeklyVariablePay: weeklyAchievements[0]?.total_variable_pay || 0,
      achievementCount: dailyAchievements[0]?.achievement_count || 0
    }
  });
}

async function handleLiveActivity(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = getPrisma();
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
    LIMIT 5
  `, today);

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
    timestamp: new Date().toLocaleTimeString()
  }));

  res.status(200).json({
    success: true,
    data: activities
  });
}

async function handleUrgentActions(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  // For now, return empty array since we don't have direct employee-customer relationship
  const rows: any[] = [];
  const now = Date.now();
  const actions = rows.map((r) => {
    const last = r.last_order_date ? new Date(r.last_order_date).getTime() : 0;
    const days = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : 999;
    const priority = days > 21 ? 'critical' : days > 14 ? 'high' : 'medium';
    return { customer: r.name, reason: `No order for ${days} days`, priority };
  });

  res.status(200).json({
    success: true,
    data: actions
  });
}

async function handleNearbyOpportunities(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = getPrisma();
  // Placeholder from DB; real geo requires locality polygons usage
  const rows: any[] = [];
  
  res.status(200).json({
    success: true,
    data: rows
  });
}
