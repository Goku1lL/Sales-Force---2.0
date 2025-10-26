import { Server as IOServer } from 'socket.io';
import { getPrisma } from '../lib/prisma';

export function startRealtime(io: IOServer) {
  let activeClients = 0;
  let lastActivityTime = Date.now();
  
  io.on('connection', () => {
    activeClients++;
    lastActivityTime = Date.now();
  });

  io.on('disconnect', () => {
    activeClients = io.engine.clientsCount || 0;
    lastActivityTime = Date.now();
  });

  // Live activity every 60s (only if clients connected)
  const liveActivityInterval = setInterval(async () => {
    // Skip if no clients or been inactive for 5 minutes
    if (activeClients === 0 || Date.now() - lastActivityTime > 300000) {
      return;
    }
    
    try {
      const prisma = (await import('../lib/prisma')).getPrisma();

      // Get recent sales achievements from today (reduced limit for memory)
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
        LIMIT 3
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
  }, 60000);

  // Urgent actions every 120s
  const urgentActionsInterval = setInterval(async () => {
    // Skip if no clients
    if (activeClients === 0) return;
    
    try {
      // For now, emit empty data since we don't have direct employee-customer relationship
      io.emit('urgent:action', []);
    } catch {
      // ignore
    }
  }, 120000);

  // Cleanup intervals on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(liveActivityInterval);
    clearInterval(urgentActionsInterval);
  });
}
