const { PrismaClient } = require('./apps/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkFullData() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    console.log('Checking full daily data for employee 1761215080220 on', today);

    const dailyData = await prisma.$queryRawUnsafe(`
      SELECT
        dt.metric,
        dt.target,
        COALESCE(da.Achievement, 0) as achievement,
        COALESCE(da.variable_pay, 0) as variable_pay
       FROM DayTargets dt
       LEFT JOIN DayAchievement da ON dt.employee_id = da.employee_id
         AND dt.date = da.date
         AND dt.metric = da.metric
         AND da.deleted = 0
       WHERE dt.employee_id = '1761215080220' AND dt.date = '${today}' AND dt.deleted = 0
    `);

    console.log('Daily data:', dailyData);
    console.log('Total daily target (units):', dailyData.reduce((sum, r) => sum + Number(r.target), 0));
    console.log('Total daily achievement (units):', dailyData.reduce((sum, r) => sum + Number(r.achievement), 0));
    console.log('Total daily earnings (₹):', dailyData.reduce((sum, r) => sum + Number(r.variable_pay), 0));

    // Check weekly data
    const weeklyData = await prisma.$queryRawUnsafe(`
      SELECT
        wt.metric,
        wt.target,
        COALESCE(wa.Achievement, 0) as achievement,
        COALESCE(wa.variable_pay, 0) as variable_pay
       FROM WeekTargets wt
       LEFT JOIN WeekAchievement wa ON wt.employee_id = wa.employee_id
         AND wt.yearweek = wa.yearweek
         AND wt.metric = wa.metric
         AND wa.deleted = 0
       WHERE wt.employee_id = '1761215080220' AND wt.yearweek = (
         SELECT MAX(yearweek) FROM WeekTargets WHERE employee_id = '1761215080220' AND deleted = 0
       ) AND wt.deleted = 0
    `);

    console.log('Weekly data:', weeklyData);
    console.log('Total weekly target (units):', weeklyData.reduce((sum, r) => sum + Number(r.target), 0));
    console.log('Total weekly achievement (units):', weeklyData.reduce((sum, r) => sum + Number(r.achievement), 0));
    console.log('Total weekly earnings (₹):', weeklyData.reduce((sum, r) => sum + Number(r.variable_pay), 0));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkFullData();