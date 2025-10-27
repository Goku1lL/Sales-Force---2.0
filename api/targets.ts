import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/targets/
  const match = path.match(/\/api\/targets\/(.+)/);
  return match ? match[1] : '';
}

// Handler: GET /api/targets/daily/[employeeId]/[date]
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
      `SELECT * FROM DayTargets WHERE employee_id = ? AND date = ? AND deleted = 0 ORDER BY metric`,
      String(employeeId), date
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/targets/weekly/[employeeId]/[yearweek]
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
      `SELECT * FROM WeekTargets WHERE employee_id = ? AND yearweek = ? AND deleted = 0 ORDER BY metric`,
      String(employeeId), Number(yearweek)
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/targets/detailed/daily/[employeeId]/[date]
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

    // Simplified DayTargets query using existing tables
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        employee_id,
        date,
        metric,
        target,
        unit
      FROM DayTargets
      WHERE employee_id = ? AND date = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), date);

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/targets/detailed/weekly/[employeeId]/[yearweek]
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

    // Simplified WeekTargets query using existing tables
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        employee_id,
        yearweek,
        metric,
        target,
        unit
      FROM WeekTargets
      WHERE employee_id = ? AND yearweek = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), Number(yearweek));

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/targets/history/[employeeId]
async function handleHistory(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM WeekTargets_History WHERE employee_id = ? ORDER BY yearweek DESC, metric`,
      String(employeeId)
    );

    res.json({ status: 'success', data: rows });
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
  } else if (subRoute.startsWith('history/')) {
    return handleHistory(req, res);
  } else if (subRoute.startsWith('daily/')) {
    return handleDaily(req, res);
  } else if (subRoute.startsWith('weekly/')) {
    return handleWeekly(req, res);
  } else {
    return res.status(404).json({ error: 'Not found' });
  }
}
