import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrisma } from '../_utils/prisma';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return; // Response already sent by requireAuth

    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    const prisma = getPrisma();

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
  } catch (error) {
    return handleError(res, error);
  }
}
