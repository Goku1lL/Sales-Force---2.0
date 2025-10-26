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
    if (url?.includes('/daily')) {
      return await handleDaily(req, res);
    } else if (url?.includes('/weekly')) {
      return await handleWeekly(req, res);
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

async function handleDaily(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId, date } = req.query;
  if (!employeeId || !date) {
    return res.status(400).json({ error: 'employeeId and date are required' });
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM DayTargets WHERE employee_id = ? AND date = ? AND deleted = 0 ORDER BY metric`,
    String(employeeId), date
  );
  
  res.status(200).json({ 
    success: true, 
    data: rows 
  });
}

async function handleWeekly(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId, yearweek } = req.query;
  if (!employeeId || !yearweek) {
    return res.status(400).json({ error: 'employeeId and yearweek are required' });
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM WeekTargets WHERE employee_id = ? AND yearweek = ? AND deleted = 0 ORDER BY metric`,
    String(employeeId), Number(yearweek)
  );
  
  res.status(200).json({ 
    success: true, 
    data: rows 
  });
}
