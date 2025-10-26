import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const profile = {
      employee_id: 1,
      name: 'John Doe',
      cluster: 'BLR-Cluster1',
      city_id: 2,
      city_name: 'Bangalore',
      weekly_achievements: 150,
      cluster_rank: 1,
      city_rank: 1
    };

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('User profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
