import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const prisma = getPrisma();

    // Get recent sales achievements from today
    const today = new Date().toISOString().slice(0, 10);

    const recentAchievements: any[] = await prisma.$queryRawUnsafe(`
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
  } catch (error) {
    return serverError(res, error);
  }
}
