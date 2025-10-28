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

    res.status(200).json({ data: urgentActions });
  } catch (error) {
    console.error('Urgent actions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
