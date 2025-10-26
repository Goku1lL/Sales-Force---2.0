import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/assigned/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const prisma = getPrisma();
    // Approximation: customers in localities mapped to executive current week
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT c.CustomerId, c.Customer, c.City, c.ContactNumber, c.CustomerSegment, c.CustomerType, c.Status, c.ExecutiveId, c.Executive
       FROM FnVCustomer_Dim c
       WHERE c.Status = 'active'
       ORDER BY c.CustomerId DESC LIMIT 200`
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/inactive/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT CustomerId, Customer, City, ContactNumber, CustomerSegment, CustomerType, Status, ExecutiveId, Executive
       FROM FnVCustomer_Dim WHERE Status = 'active'
       ORDER BY CustomerId ASC LIMIT 200`
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/high-value/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT CustomerId, Customer, City, ContactNumber, CustomerSegment, CustomerType, Status, ExecutiveId, Executive
       FROM FnVCustomer_Dim WHERE Status = 'active' ORDER BY CustomerId DESC LIMIT 200`
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

export default router;
