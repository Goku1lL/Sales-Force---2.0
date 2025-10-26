import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    return res.json({ user });
  } catch (error) {
    return handleError(res, error);
  }
}
