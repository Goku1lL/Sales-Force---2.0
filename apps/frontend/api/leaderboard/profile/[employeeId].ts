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
      return createErrorResponse('Employee not found', 404);
    }

    return createResponse({ data: employee[0] });
  } catch (error) {
    console.error('Leaderboard profile error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
