import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId || typeof employeeId !== 'string') {
      return res.status(400).json({ error: 'employeeId is required' });
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
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(200).json({ data: employee[0] });
  } catch (error) {
    console.error('Leaderboard profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
