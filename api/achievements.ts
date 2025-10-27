import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/achievements/
  const match = path.match(/\/api\/achievements\/(.+)/);
  return match ? match[1] : '';
}

// Handler: GET /api/achievements/daily/[employeeId]/[date]
async function handleDaily(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    const date = req.query.date as string;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const prisma = getPrisma();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM DayAchievement WHERE employee_id = ? AND date = ? AND deleted = 0 ORDER BY metric`,
      String(employeeId), date
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/achievements/weekly/[employeeId]/[yearweek]
async function handleWeekly(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    const yearweek = req.query.yearweek as string;

    if (!employeeId || !yearweek) {
      return res.status(400).json({ error: 'employeeId and yearweek are required' });
    }

    const prisma = getPrisma();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM WeekAchievement WHERE employee_id = ? AND yearweek = ? AND deleted = 0 ORDER BY metric`,
      String(employeeId), Number(yearweek)
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/achievements/detailed/daily/[employeeId]/[date]
async function handleDetailedDaily(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    const date = req.query.date as string;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const prisma = getPrisma();

    // Get all day achievements for the employee and date
    const allAchievements: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        employee_id,
        date,
        metric,
        Achievement,
        variable_pay,
        contribution
      FROM DayAchievement
      WHERE employee_id = ? AND date = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), date);

    res.json({ status: 'success', data: allAchievements });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/achievements/detailed/weekly/[employeeId]/[yearweek]
async function handleDetailedWeekly(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    const yearweek = req.query.yearweek as string;

    if (!employeeId || !yearweek) {
      return res.status(400).json({ error: 'employeeId and yearweek are required' });
    }

    const prisma = getPrisma();

    // Get all week achievements for the employee and yearweek
    const allAchievements: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        employee_id,
        yearweek,
        metric,
        Achievement,
        variable_pay,
        contribution
      FROM WeekAchievement
      WHERE employee_id = ? AND yearweek = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), Number(yearweek));

    res.json({ status: 'success', data: allAchievements });
  } catch (error) {
    return serverError(res, error);
  }
}

// Main handler - routes to sub-handlers based on URL
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subRoute = getSubRoute(req);

  // Check for detailed routes first (more specific)
  if (subRoute.startsWith('detailed/daily/')) {
    return handleDetailedDaily(req, res);
  } else if (subRoute.startsWith('detailed/weekly/')) {
    return handleDetailedWeekly(req, res);
  } else if (subRoute.startsWith('daily/')) {
    return handleDaily(req, res);
  } else if (subRoute.startsWith('weekly/')) {
    return handleWeekly(req, res);
  } else {
    return res.status(404).json({ error: 'Not found' });
  }
}
