import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
