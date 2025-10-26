import { Server as IOServer } from 'socket.io';
import { getPrisma } from '../lib/prisma';

export function startRealtime(io: IOServer) {
  // Live activity every 30s - now enabled with actual achievement data
  setInterval(async () => {
    try {
      const prisma = (await import('../lib/prisma')).getPrisma();

      // Get recent sales achievements from today
      const today = new Date().toISOString().slice(0, 10);

      const recentAchievements = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          da.employee_id,
          da.Achievement,
          da.variable_pay,
          da.date,
          da.metric,
          da.unit,
          e.Name as employee_name,
          e.cluster,
          e.role
        FROM DayAchievement da
        JOIN Executive e ON da.employee_id = e.employee_id
        WHERE da.date >= ?
          AND da.Achievement > 0
          AND da.deleted = 0
        ORDER BY da.date DESC, da.Achievement DESC
        LIMIT 10
      `, today);

      // Format the activities for real-time emission
      const activities = recentAchievements.map((achievement: any) => ({
        id: `${achievement.employee_id}_${achievement.date}_${achievement.metric}`,
        message: `${achievement.employee_name} achieved ${achievement.Achievement}${achievement.unit ? ' ' + achievement.unit : ''} in ${achievement.metric}`,
        employee_name: achievement.employee_name,
        cluster: achievement.cluster,
        metric: achievement.metric,
        achievement: achievement.Achievement,
        unit: achievement.unit,
        variable_pay: achievement.variable_pay,
        date: achievement.date,
        timestamp: new Date().toLocaleTimeString()
      }));

      // Emit to all connected clients
      io.emit('live:activity', activities);

    } catch (error) {
      console.error('Error in live activity publisher:', error);
      // ignore transient errors
    }
  }, 30000);

  // Urgent actions every 60s - disabled for now since we don't have proper employee-customer relationships
  setInterval(async () => {
    try {
      // For now, emit empty data since we don't have direct employee-customer relationship
      io.emit('urgent:action', []);
    } catch {
      // ignore
    }
  }, 60000);
}
