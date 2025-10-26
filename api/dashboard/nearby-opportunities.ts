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

    const prisma = getPrisma();
    
    // Placeholder from DB; real geo requires locality polygons usage
    // For now, return empty array since we don't have direct employee-customer relationship
    const rows: any[] = [];
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    return handleError(res, error);
  }
}
