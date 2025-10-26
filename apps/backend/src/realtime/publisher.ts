import { Server as IOServer } from 'socket.io';
import { getPrisma } from '../lib/prisma';

export function startRealtime(io: IOServer) {
  // Only start realtime features if there are connected clients
  let hasClients = false;
  
  io.on('connection', () => {
    hasClients = true;
  });

  io.on('disconnect', () => {
    hasClients = io.engine.clientsCount > 0;
  });

  // Live activity every 60s (reduced frequency to save memory)
  setInterval(async () => {
    if (!hasClients) return; // Skip if no clients connected
    
    try {
      const prisma = (await import('../lib/prisma')).getPrisma();

      // Get recent sales achievements from today (reduced limit)
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
        LIMIT 5
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
  }, 60000); // Increased interval to 60s

  // Urgent actions every 120s (reduced frequency)
  setInterval(async () => {
    if (!hasClients) return; // Skip if no clients connected
    
    try {
      // For now, emit empty data since we don't have direct employee-customer relationship
      io.emit('urgent:action', []);
    } catch {
      // ignore
    }
  }, 120000); // Increased interval to 120s
}
