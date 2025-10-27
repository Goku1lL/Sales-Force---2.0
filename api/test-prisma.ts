import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrisma } from '@sfa/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prisma = getPrisma();
    // Test Prisma connection
    await prisma.$connect();
    
    res.status(200).json({
      success: true,
      message: 'Prisma client working correctly',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Prisma test error:', error);
    return res.status(500).json({ 
      error: 'Prisma connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
