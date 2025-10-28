import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const { slug } = req.query;
  const path = slug ? slug.join('/') : '';

  try {
  // Route to appropriate handler based on path (handle both /api/v1/* and direct calls)
  const cleanPath = path.startsWith('v1/') ? path.substring(3) : path;

  if (cleanPath.startsWith('dashboard/summary')) {
    return await handleDashboardSummary(req, res);
  } else if (cleanPath.startsWith('dashboard/urgent-actions')) {
    return await handleUrgentActions(req, res);
  } else if (cleanPath.startsWith('dashboard/nearby-opportunities')) {
    return await handleNearbyOpportunities(req, res);
  } else if (cleanPath.startsWith('dashboard/live-activity')) {
    return await handleLiveActivity(req, res);
  } else if (cleanPath.startsWith('leaderboard/profile/')) {
    return await handleLeaderboardProfile(req, res);
  } else if (cleanPath.startsWith('leaderboard/employee-details/')) {
    return await handleEmployeeDetails(req, res);
  } else if (cleanPath.startsWith('customers/assigned/')) {
    return await handleAssignedCustomers(req, res);
  } else if (cleanPath.startsWith('customers/inactive/')) {
    return await handleInactiveCustomers(req, res);
  } else if (cleanPath.startsWith('customers/high-value/')) {
    return await handleHighValueCustomers(req, res);
  }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDashboardSummary(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  return res.status(200).json({ data: summary });
}

async function handleUrgentActions(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Get urgent actions - customers who haven't been contacted recently
  const urgentActions = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      c.Id,
      c.customername,
      c.contactnumber,
      c.Priority,
      c.LastOrder,
      c.LastOpened,
      CASE
        WHEN c.LastOrder IS NULL OR c.LastOrder > 30 THEN 'High Priority - No recent orders'
        WHEN c.LastOrder > 14 THEN 'Medium Priority - Stale orders'
        ELSE 'Low Priority'
      END as urgency_reason
     FROM SA_HomePageTargetCustomers c
     WHERE c.employee_id = ?
       AND (c.LastOrder IS NULL OR c.LastOrder > 14)
     ORDER BY c.Priority ASC, c.LastOrder DESC
     LIMIT 10`,
    employeeId
  );

  return res.status(200).json({ data: urgentActions });
}

async function handleNearbyOpportunities(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get nearby opportunities - high-value customers with recent activity
  const nearbyOpportunities = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      c.Id,
      c.customername,
      c.contactnumber,
      c.Priority,
      c.LastOrder,
      c.LastOpened,
      CASE
        WHEN c.LastOrder <= 7 THEN 'Recent Activity'
        WHEN c.LastOrder <= 14 THEN 'Moderate Activity'
        ELSE 'Low Activity'
      END as activity_level
     FROM SA_HomePageHighValueCustomers c
     WHERE c.LastOrder <= 14
     ORDER BY c.Priority ASC, c.LastOrder ASC
     LIMIT 10`
  );

  return res.status(200).json({ data: nearbyOpportunities });
}

async function handleLiveActivity(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get live activity - recent achievements and activities
  const liveActivity = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      e.name as employee_name,
      e.cluster,
      da.metric,
      da.Achievement,
      da.date,
      'Daily Achievement' as activity_type
     FROM DayAchievement da
     JOIN Executive e ON da.employee_id = e.employee_id
     WHERE da.date = CURDATE() AND da.deleted = 0
     ORDER BY da.created_at DESC
     LIMIT 10

     UNION ALL

     SELECT
      e.name as employee_name,
      e.cluster,
      wa.metric,
      wa.Achievement,
      wa.yearweek as date,
      'Weekly Achievement' as activity_type
     FROM WeekAchievement wa
     JOIN Executive e ON wa.employee_id = e.employee_id
     WHERE wa.yearweek = YEARWEEK(NOW()) AND wa.deleted = 0
     ORDER BY wa.created_at DESC
     LIMIT 10`
  );

  return res.status(200).json({ data: liveActivity });
}

async function handleLeaderboardProfile(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employeeId = cleanPath.split('/').pop();

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  // Get employee profile
  const employee = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      e.employee_id,
      e.name,
      e.cluster,
      e.city,
      e.CityId,
      e.variable_pay,
      e.cluster_rank,
      e.city_rank
     FROM Executive e
     WHERE e.employee_id = ?`,
    employeeId
  );

  if (employee.length === 0) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  return res.status(200).json({ data: employee[0] });
}

async function handleEmployeeDetails(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employeeId = cleanPath.split('/').pop();

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  // Get employee details with daily and weekly metrics
  const employee = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      e.employee_id,
      e.name,
      e.cluster,
      e.city,
      e.CityId,
      e.variable_pay
     FROM Executive e
     WHERE e.employee_id = ?`,
    employeeId
  );

  if (employee.length === 0) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Get daily metrics
  const dailyMetrics = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      dt.metric,
      dt.target,
      dt.slab_Segment,
      dt.incentive_percent,
      COALESCE(da.Achievement, 0) as achievement,
      COALESCE(da.variable_pay, 0) as variable_pay
     FROM DayTargets dt
     LEFT JOIN DayAchievement da ON dt.employee_id = da.employee_id
       AND dt.date = da.date
       AND dt.metric = da.metric
       AND da.deleted = 0
     WHERE dt.employee_id = ? AND dt.date = ? AND dt.deleted = 0
     ORDER BY dt.metric, dt.slab_Segment`,
    employeeId, today
  );

  // Get weekly metrics
  const weeklyMetrics = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      wt.metric,
      wt.target,
      wt.slab_Segment,
      wt.incentive_percent,
      COALESCE(wa.Achievement, 0) as achievement,
      COALESCE(wa.variable_pay, 0) as variable_pay
     FROM WeekTargets wt
     LEFT JOIN WeekAchievement wa ON wt.employee_id = wa.employee_id
       AND wt.yearweek = wa.yearweek
       AND wt.metric = wa.metric
       AND wa.deleted = 0
     WHERE wt.employee_id = ? AND wt.yearweek = YEARWEEK(NOW()) AND wt.deleted = 0
     ORDER BY wt.metric, wt.slab_Segment`,
    employeeId
  );

  const response = {
    employee: employee[0],
    daily: {
      metrics: dailyMetrics,
      totals: {
        target: dailyMetrics.reduce((sum, m) => sum + Number(m.target || 0), 0),
        achievement: dailyMetrics.reduce((sum, m) => sum + Number(m.achievement || 0), 0),
        earnings: dailyMetrics.reduce((sum, m) => sum + Number(m.variable_pay || 0), 0),
      }
    },
    weekly: {
      metrics: weeklyMetrics,
      totals: {
        target: weeklyMetrics.reduce((sum, m) => sum + Number(m.target || 0), 0),
        achievement: weeklyMetrics.reduce((sum, m) => sum + Number(m.achievement || 0), 0),
        earnings: weeklyMetrics.reduce((sum, m) => sum + Number(m.variable_pay || 0), 0),
      }
    }
  };

  return res.status(200).json({ data: response });
}

async function handleAssignedCustomers(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employeeId = cleanPath.split('/').pop();

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  // Get assigned customers
  const customers = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      Id,
      customername,
      description,
      contactnumber,
      Priority,
      LastOrder,
      LastOpened
     FROM SA_HomePageTargetCustomers
     WHERE employee_id = ?
     ORDER BY Priority ASC, LastOrder DESC`,
    employeeId
  );

  return res.status(200).json({ data: customers });
}

async function handleInactiveCustomers(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employeeId = cleanPath.split('/').pop();

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  // Get inactive customers (App Funnel)
  const customers = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      Id,
      customername,
      description,
      contactnumber,
      Priority,
      LastOrder,
      LastOpened
     FROM SA_HomePageAppFunnelCustomers
     WHERE employee_id = ?
     ORDER BY Priority ASC, LastOpened DESC`,
    employeeId
  );

  return res.status(200).json({ data: customers });
}

async function handleHighValueCustomers(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employeeId = cleanPath.split('/').pop();

  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  // Get high-value customers (Priority Customers)
  const customers = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      Id,
      customername,
      description,
      contactnumber,
      Priority,
      LastOrder,
      LastOpened
     FROM SA_HomePageHighValueCustomers
     WHERE employee_id = ?
     ORDER BY Priority ASC, LastOrder DESC`,
    employeeId
  );

  return res.status(200).json({ data: customers });
}
