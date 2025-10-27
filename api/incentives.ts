import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/incentives/
  const match = path.match(/\/api\/incentives\/(.+)/);
  return match ? match[1] : '';
}

// Helper to parse path parameters and populate req.query
function parsePathParams(req: VercelRequest, subRoute: string, pattern: RegExp, paramNames: string[]) {
  const match = subRoute.match(pattern);
  if (match) {
    paramNames.forEach((name, index) => {
      if (!req.query) req.query = {};
      req.query[name] = match[index + 1];
    });
  }
}

// Handler: GET /api/incentives/breakdown/[employeeId]/[period]
async function handleBreakdown(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;
    const period = req.query.period as string;

    if (!employeeId || !period) {
      return res.status(400).json({ error: 'employeeId and period are required' });
    }

    const prisma = getPrisma();

    if (period === 'weekly') {
      const yearweekRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT MAX(yearweek) as yw FROM WeekAchievement WHERE employee_id = ? AND deleted = 0`,
        Number(employeeId)
      );
      const yw = yearweekRows?.[0]?.yw;
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT metric, SUM(variable_pay) as variable_pay, SUM(contribution) as contribution
         FROM WeekAchievement WHERE employee_id = ? AND yearweek = ? AND deleted = 0 GROUP BY metric`,
        Number(employeeId), yw
      );
      return res.json({ status: 'success', data: { period, yearweek: yw, metrics: rows } });
    }

    // default daily
    const today = new Date().toISOString().slice(0, 10);
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT metric, SUM(variable_pay) as variable_pay, SUM(contribution) as contribution
       FROM DayAchievement WHERE employee_id = ? AND date = ? AND deleted = 0 GROUP BY metric`,
      Number(employeeId), today
    );
    return res.json({ status: 'success', data: { period: 'daily', date: today, metrics: rows } });
  } catch (error) {
    return serverError(res, error);
  }
}

// Main handler - routes to sub-handlers based on URL
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subRoute = getSubRoute(req);

  if (subRoute.startsWith('breakdown/')) {
    parsePathParams(req, subRoute, /^breakdown\/([^/]+)\/([^/]+)/, ['employeeId', 'period']);
    return handleBreakdown(req, res);
  } else {
    return res.status(404).json({ error: 'Not found' });
  }
}
