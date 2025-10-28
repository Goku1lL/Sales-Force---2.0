import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/breakdown/:employeeId/:period', authMiddleware, async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const period = String(req.params.period);
    const prisma = getPrisma();

    if (period === 'weekly') {
      const yearweekRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT MAX(yearweek) as yw FROM WeekAchievement WHERE employee_id = ? AND deleted = 0`,
        employeeId
      );
      const yw = yearweekRows?.[0]?.yw;
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT metric, SUM(variable_pay) as variable_pay, SUM(contribution) as contribution
         FROM WeekAchievement WHERE employee_id = ? AND yearweek = ? AND deleted = 0 GROUP BY metric`,
        employeeId, yw
      );
      return res.json({ status: 'success', data: { period, yearweek: yw, metrics: rows } });
    }

    // default daily
    const today = new Date().toISOString().slice(0, 10);
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT metric, SUM(variable_pay) as variable_pay, SUM(contribution) as contribution
       FROM DayAchievement WHERE employee_id = ? AND date = ? AND deleted = 0 GROUP BY metric`,
      employeeId, today
    );
    return res.json({ status: 'success', data: { period: 'daily', date: today, metrics: rows } });
  } catch (err) { next(err); }
});

export default router;
