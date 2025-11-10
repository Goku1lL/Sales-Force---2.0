import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/assigned/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const prisma = getPrisma();
    // Fetch target customers for this employee
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        employee_id,
        customer_id,
        customername,
        contactnumber,
        LastOrder,
        description,
        Priority
       FROM SA_HomePageTargetCustomers
       WHERE employee_id = ? AND deleted = 0
       ORDER BY LastOrder ASC, Priority ASC
       LIMIT 100`
    , employeeId);
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/inactive/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        employee_id,
        customer_id,
        customername,
        contactnumber,
        LastOpened,
        description,
        Priority
       FROM SA_HomePageAppFunnelCustomers
       WHERE employee_id = ?
       ORDER BY LastOpened ASC, Priority ASC
       LIMIT 100`
    , employeeId);
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/high-value/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const prisma = getPrisma();
    // For high-value customers, fetch target customers sorted by priority
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        employee_id,
        customer_id,
        customername,
        contactnumber,
        LastOrder,
        description,
        Priority
       FROM SA_HomePageTargetCustomers
       WHERE employee_id = ? AND deleted = 0 AND Priority = 1
       ORDER BY LastOrder ASC, Priority ASC
       LIMIT 50`
    , employeeId);
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/customer-page/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const prisma = getPrisma();
    // Fetch customers from SA_CustomerPageCustomers table
    // Group by customer_id to get unique customers with their latest data
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        employee_id,
        customer_id,
        customername,
        contactnumber,
        description,
        Priority,
        metric,
        date,
        yearweek,
        layer,
        Sku,
        skuid
       FROM SA_CustomerPageCustomers
       WHERE employee_id = ?
       ORDER BY date DESC, Priority ASC
       LIMIT 500`
    , employeeId);
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

export default router;
