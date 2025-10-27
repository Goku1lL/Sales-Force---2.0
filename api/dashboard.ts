import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/dashboard/
  const match = path.match(/\/api\/dashboard\/(.+)/);
  return match ? match[1] : '';
}

// Handler: GET /api/dashboard/summary
async function handleSummary(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    // Mock data for now - replace with real database queries later
    const summary = {
      dailyProgress: 75,
      weeklyProgress: 60,
      dailyPercent: 75,
      weeklyPercent: 60,
      dailyTarget: 100,
      weeklyTarget: 500,
      dailyVariablePay: 750,
      weeklyVariablePay: 3000,
      achievementCount: 3
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: GET /api/dashboard/live-activity
async function handleLiveActivity(req: VercelRequest, res: VercelResponse) {
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

// Handler: GET /api/dashboard/nearby-opportunities
async function handleNearbyOpportunities(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const opportunities = [
      { name: 'Nearby Customer 1', distance: '2.5 km', potential: 'High' },
      { name: 'Nearby Customer 2', distance: '1.8 km', potential: 'Medium' }
    ];

    res.status(200).json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Nearby opportunities error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: GET /api/dashboard/urgent-actions
async function handleUrgentActions(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const urgentActions = [
      { customer: 'Customer A', reason: 'No order for 15 days', priority: 'high' },
      { customer: 'Customer B', reason: 'No order for 25 days', priority: 'critical' }
    ];

    res.status(200).json({
      success: true,
      data: urgentActions
    });
  } catch (error) {
    console.error('Urgent actions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Main handler - routes to sub-handlers based on URL
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subRoute = getSubRoute(req);

  if (subRoute === 'summary' || subRoute.startsWith('summary?')) {
    return handleSummary(req, res);
  } else if (subRoute === 'live-activity' || subRoute.startsWith('live-activity?')) {
    return handleLiveActivity(req, res);
  } else if (subRoute === 'nearby-opportunities' || subRoute.startsWith('nearby-opportunities?')) {
    return handleNearbyOpportunities(req, res);
  } else if (subRoute === 'urgent-actions' || subRoute.startsWith('urgent-actions?')) {
    return handleUrgentActions(req, res);
  } else {
    return res.status(404).json({ error: 'Not found' });
  }
}
