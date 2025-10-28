import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get nearby opportunities - high-value customers with recent activity
    const nearbyOpportunities = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        c.Id,
        c.customername,
        c.contactnumber,
        c.Priority,
        c.LastOrder,
        c.LastOpened,
        CASE 
          WHEN c.LastOrder <= 7 THEN 'Recent Activity'
          WHEN c.LastOrder <= 14 THEN 'Moderate Activity'
          ELSE 'Low Activity'
        END as activity_level
       FROM SA_HomePageHighValueCustomers c
       WHERE c.LastOrder <= 14
       ORDER BY c.Priority ASC, c.LastOrder ASC
       LIMIT 10`
    );

    res.status(200).json({ data: nearbyOpportunities });
  } catch (error) {
    console.error('Nearby opportunities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
