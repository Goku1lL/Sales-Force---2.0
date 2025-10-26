import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
