import { IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: IncomingMessage & { query: Record<string, string | string[]> }, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId || typeof employeeId !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'employeeId is required' });
    }

    // Get inactive customers (App Funnel)
    const customers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        customername,
        description,
        contactnumber,
        Priority,
        LastOrder,
        LastOpened
       FROM SA_HomePageAppFunnelCustomers
       WHERE employee_id = ?
       ORDER BY Priority ASC, LastOpened DESC`,
      employeeId
    );

    res.writeHead(200, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ data: customers });
  } catch (error) {
    console.error('Inactive customers error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Internal server error' });
  }
}
