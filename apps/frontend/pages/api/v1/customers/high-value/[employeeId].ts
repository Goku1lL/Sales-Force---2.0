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

    // Get high-value customers (Priority Customers)
    const customers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        customername,
        description,
        contactnumber,
        Priority,
        LastOrder,
        LastOpened
       FROM SA_HomePageHighValueCustomers
       WHERE employee_id = ?
       ORDER BY Priority ASC, LastOrder DESC`,
      employeeId
    );

    res.status(200).json({ data: customers });
  } catch (error) {
    console.error('High-value customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
