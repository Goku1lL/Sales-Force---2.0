import { NextRequest } from 'next/server';
import { prisma } from '../lib/db';
import { verifyToken, createResponse, createErrorResponse } from '../lib/auth';

export async function GET(request: NextRequest, { params }: { params: { employeeId: string } }) {
  try {
    // Verify authentication
    const authPayload = verifyToken(request);
    if (!authPayload) {
      return createErrorResponse('Unauthorized', 401);
    }

    const employeeId = params.employeeId;
    
    if (!employeeId || employeeId.trim() === '') {
      return createErrorResponse('employeeId is required');
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

    return createResponse({ data: customers });
  } catch (error) {
    console.error('Inactive customers error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
