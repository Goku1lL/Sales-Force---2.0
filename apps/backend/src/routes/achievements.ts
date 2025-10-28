import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/daily/:employeeId/:date', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const date = String(req.params.date);
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM DayAchievement WHERE employee_id = ? AND date = ? AND deleted = 0 ORDER BY metric`,
      employeeId, date
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

router.get('/weekly/:employeeId/:yearweek', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const yearweek = Number(req.params.yearweek);
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM WeekAchievement WHERE employee_id = ? AND yearweek = ? AND deleted = 0 ORDER BY metric`,
      employeeId, yearweek
    );
    res.json({ status: 'success', data: rows });
  } catch (err) { next(err); }
});

// Detailed achievements with comprehensive SQL queries
router.get('/detailed/daily/:employeeId/:date', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, date } = req.params;
    const prisma = getPrisma();
    
    // Get all day achievements for the employee and date
    const allAchievements = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        employee_id,
        date,
        metric,
        Achievement,
        variable_pay,
        contribution
      FROM DayAchievement
      WHERE employee_id = ? AND date = ? AND deleted = 0
      ORDER BY metric
    `, String(employeeId), date);
    
    res.json({ status: 'success', data: allAchievements });
  } catch (err) { next(err); }
});

router.get('/detailed/weekly/:employeeId/:yearweek', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, yearweek } = req.params;
    const prisma = getPrisma();
    
    // Get all week achievements for the employee and yearweek
    const allAchievements = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        employee_id,
        yearweek,
        metric,
        Achievement,
        variable_pay,
        contribution
      FROM WeekAchievement
      WHERE employee_id = ? AND yearweek = ? AND deleted = 0
      ORDER BY metric
      `, employeeId, Number(yearweek));
    
    res.json({ status: 'success', data: allAchievements });
  } catch (err) { next(err); }
});

export default router;
