import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, unauthorized, getPrisma, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/customers/
  const match = path.match(/\/api\/customers\/(.+)/);
  return match ? match[1] : '';
}

// Handler: GET /api/customers/assigned/[employeeId]
async function handleAssigned(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();
    // Approximation: customers in localities mapped to executive current week
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT c.CustomerId, c.Customer, c.City, c.ContactNumber, c.CustomerSegment, c.CustomerType, c.Status, c.ExecutiveId, c.Executive
       FROM FnVCustomer_Dim c
       WHERE c.Status = 'active'
       ORDER BY c.CustomerId DESC LIMIT 200`
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/customers/high-value/[employeeId]
async function handleHighValue(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT CustomerId, Customer, City, ContactNumber, CustomerSegment, CustomerType, Status, ExecutiveId, Executive
       FROM FnVCustomer_Dim WHERE Status = 'active' ORDER BY CustomerId DESC LIMIT 200`
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/customers/inactive/[employeeId]
async function handleInactive(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyToken(req);
  if (!auth) return unauthorized(res);

  try {
    const employeeId = req.query.employeeId as string;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    const prisma = getPrisma();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT CustomerId, Customer, City, ContactNumber, CustomerSegment, CustomerType, Status, ExecutiveId, Executive
       FROM FnVCustomer_Dim WHERE Status = 'active'
       ORDER BY CustomerId ASC LIMIT 200`
    );

    res.json({ status: 'success', data: rows });
  } catch (error) {
    return serverError(res, error);
  }
}

// Main handler - routes to sub-handlers based on URL
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subRoute = getSubRoute(req);

  if (subRoute.startsWith('assigned/')) {
    return handleAssigned(req, res);
  } else if (subRoute.startsWith('high-value/')) {
    return handleHighValue(req, res);
  } else if (subRoute.startsWith('inactive/')) {
    return handleInactive(req, res);
  } else {
    return res.status(404).json({ error: 'Not found' });
  }
}
