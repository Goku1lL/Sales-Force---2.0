import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/weekly/:employeeId/:yearweek', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, yearweek } = req.params;
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM WeekTargets WHERE employee_id = ? AND yearweek = ? AND deleted = 0 ORDER BY metric`,
      employeeId, Number(yearweek)
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/daily/:employeeId/:date', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, date } = req.params;
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM DayTargets WHERE employee_id = ? AND date = ? AND deleted = 0 ORDER BY metric`,
      employeeId, date
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

// Detailed targets with comprehensive SQL queries
router.get('/detailed/daily/:employeeId/:date', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, date } = req.params;
    const prisma = getPrisma();
    
    // Simplified DayTargets query using existing tables
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        employee_id,
        date,
        metric,
        target,
        unit,
        slab_Segment,
        contribution,
        variable_pay
      FROM DayTargets 
      WHERE employee_id = ? AND date = ? AND deleted = 0
      ORDER BY metric, slab_Segment
    `, employeeId, date);
    
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/detailed/weekly/:employeeId/:yearweek', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, yearweek } = req.params;
    const prisma = getPrisma();
    
    // Simplified WeekTargets query using existing tables
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        employee_id,
        yearweek,
        metric,
        target,
        unit,
        slab_Segment,
        contribution,
        variable_pay
      FROM WeekTargets 
      WHERE employee_id = ? AND yearweek = ? AND deleted = 0
      ORDER BY metric, slab_Segment
    `, employeeId, Number(yearweek));
    
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/history/:employeeId', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM WeekTargets_History WHERE employee_id = ? ORDER BY yearweek DESC, metric`,
      String(employeeId)
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

export default router;
