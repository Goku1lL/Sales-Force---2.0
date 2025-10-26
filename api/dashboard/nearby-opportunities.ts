import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now
    const opportunities = [
      { name: 'Nearby Customer 1', distance: '2.5 km', potential: 'High' },
      { name: 'Nearby Customer 2', distance: '1.8 km', potential: 'Medium' }
    ];

    res.status(200).json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Nearby opportunities error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
