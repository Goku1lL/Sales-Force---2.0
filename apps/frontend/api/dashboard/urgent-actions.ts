import { NextRequest } from 'next/server';
import { prisma } from '../lib/db';
import { verifyToken, createResponse, createErrorResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authPayload = verifyToken(request);
    if (!authPayload) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    
    if (!employeeId || employeeId.trim() === '') {
      return createErrorResponse('employeeId is required');
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

    return createResponse({ data: urgentActions });
  } catch (error) {
    console.error('Urgent actions error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
