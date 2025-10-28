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

    // Get employee profile
    const employee = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        e.employee_id,
        e.name,
        e.cluster,
        e.city,
        e.CityId,
        e.variable_pay,
        e.cluster_rank,
        e.city_rank
       FROM Executive e
       WHERE e.employee_id = ?`,
      employeeId
    );

    if (employee.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Employee not found' });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ data: employee[0] });
  } catch (error) {
    console.error('Leaderboard profile error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' );
    res.end(JSON.stringify({ error: 'Internal server error' });
  }
}
