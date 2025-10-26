import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrisma } from '../_utils/prisma';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    // Route based on URL path
    if (url?.includes('/assigned')) {
      return await handleAssigned(req, res);
    } else if (url?.includes('/inactive')) {
      return await handleInactive(req, res);
    } else if (url?.includes('/high-value')) {
      return await handleHighValue(req, res);
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

async function handleAssigned(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.CustomerId, c.Customer, c.City, c.ContactNumber, c.CustomerSegment, c.CustomerType, c.Status, c.ExecutiveId, c.Executive
     FROM FnVCustomer_Dim c
     WHERE c.Status = 'active'
     ORDER BY c.CustomerId DESC LIMIT 200`
  );
  
  res.status(200).json({ 
    success: true, 
    data: rows 
  });
}

async function handleInactive(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT CustomerId, Customer, City, ContactNumber, CustomerSegment, CustomerType, Status, ExecutiveId, Executive
     FROM FnVCustomer_Dim WHERE Status = 'active'
     ORDER BY CustomerId ASC LIMIT 200`
  );
  
  res.status(200).json({ 
    success: true, 
    data: rows 
  });
}

async function handleHighValue(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT CustomerId, Customer, City, ContactNumber, CustomerSegment, CustomerType, Status, ExecutiveId, Executive
     FROM FnVCustomer_Dim WHERE Status = 'active' ORDER BY CustomerId DESC LIMIT 200`
  );
  
  res.status(200).json({ 
    success: true, 
    data: rows 
  });
}
