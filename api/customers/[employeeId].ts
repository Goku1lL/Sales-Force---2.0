import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    
    if (!employeeId || typeof employeeId !== 'string') {
      return res.status(400).json({ error: 'employeeId is required' });
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

    res.status(200).json({ data: customers });
  } catch (error) {
    console.error('Inactive customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
