import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    // Get today's date
    const today = new Date().toISOString().slice(0, 10);
    
    // Get daily achievements
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

    // Get weekly achievements (last 7 days)
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

    // Get targets (assuming you have a targets table)
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

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
