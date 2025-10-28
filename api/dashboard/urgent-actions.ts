import { IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId || typeof employeeId !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'employeeId is required' }));
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Get urgent actions - customers who haven't been contacted recently
    const urgentActions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        c.Id,
        c.customername,
        c.contactnumber,
        c.Priority,
        c.LastOrder,
        c.LastOpened,
        CASE 
          WHEN c.LastOrder IS NULL OR c.LastOrder > 30 THEN 'High Priority - No recent orders'
          WHEN c.LastOrder > 14 THEN 'Medium Priority - Stale orders'
          ELSE 'Low Priority'
        END as urgency_reason
       FROM SA_HomePageTargetCustomers c
       WHERE c.employee_id = ? 
         AND (c.LastOrder IS NULL OR c.LastOrder > 14)
       ORDER BY c.Priority ASC, c.LastOrder DESC
       LIMIT 10`,
      employeeId
    );

    res.writeHead(200, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ data: urgentActions });
  } catch (error) {
    console.error('Urgent actions error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Internal server error' });
  }
}
