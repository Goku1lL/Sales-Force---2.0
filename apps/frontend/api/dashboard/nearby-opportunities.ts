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

    // Get nearby opportunities - high-value customers with recent activity
    const nearbyOpportunities = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        c.Id,
        c.customername,
        c.contactnumber,
        c.Priority,
        c.LastOrder,
        c.LastOpened,
        CASE 
          WHEN c.LastOrder <= 7 THEN 'Recent Activity'
          WHEN c.LastOrder <= 14 THEN 'Moderate Activity'
          ELSE 'Low Activity'
        END as activity_level
       FROM SA_HomePageHighValueCustomers c
       WHERE c.LastOrder <= 14
       ORDER BY c.Priority ASC, c.LastOrder ASC
       LIMIT 10`
    );

    return createResponse({ data: nearbyOpportunities });
  } catch (error) {
    console.error('Nearby opportunities error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
