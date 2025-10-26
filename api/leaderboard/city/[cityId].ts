import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const leaderboard = [
      { employee_id: 1, name: 'John Doe', city_id: 2, city_name: 'Bangalore', weekly_achievements: 150, rank: 1 },
      { employee_id: 2, name: 'Jane Smith', city_id: 2, city_name: 'Bangalore', weekly_achievements: 120, rank: 2 },
      { employee_id: 3, name: 'Bob Johnson', city_id: 2, city_name: 'Bangalore', weekly_achievements: 100, rank: 3 }
    ];

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('City leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
