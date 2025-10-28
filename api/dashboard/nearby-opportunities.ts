import { IncomingMessage, ServerResponse } from 'http';
import PrismaClient from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: IncomingMessage & { query: Record<string, string | string[]> }, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Method not allowed' });
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

    res.writeHead(200, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ data: nearbyOpportunities });
  } catch (error) {
    console.error('Nearby opportunities error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Internal server error' });
  }
}
