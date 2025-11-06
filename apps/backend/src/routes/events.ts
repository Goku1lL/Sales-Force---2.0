/**
 * Events Tracking API
 * 
 * Endpoints for tracking user events and analytics
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

interface EventPayload {
  event_name: string;
  meta_data?: Record<string, any>;
}

interface BatchEventRequest {
  employee_id: string;
  events: EventPayload[];
}

/**
 * POST /api/v1/events/track
 * 
 * Batch endpoint for tracking multiple events at once
 * 
 * Body:
 * {
 *   "employee_id": "SNC1063",
 *   "events": [
 *     {
 *       "event_name": "page_view",
 *       "meta_data": { "page": "dashboard", "timestamp": "2024-11-06T10:30:00Z" }
 *     }
 *   ]
 * }
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    console.log('📊 Received event tracking request:', JSON.stringify(req.body, null, 2));
    
    const { employee_id, events } = req.body as BatchEventRequest;
    
    // Validate payload
    if (!employee_id || !events || !Array.isArray(events)) {
      console.error('❌ Invalid event tracking payload:', { employee_id, events: Array.isArray(events) });
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payload. Expected { employee_id: string, events: array }' 
      });
    }

    if (events.length === 0) {
      console.log('⚠️ No events to track');
      return res.status(200).json({ success: true, tracked: 0 });
    }

    // Prepare events for insertion
    const now = new Date();
    
    // Insert events using raw SQL for compatibility
    let insertedCount = 0;
    for (const event of events) {
      try {
        await prisma.$executeRaw`
          INSERT INTO SA_ExecutiveAppEvents (entry_date, entry_time, employee_id, event_name, meta_data)
          VALUES (${now}, ${now}, ${employee_id}, ${event.event_name}, ${JSON.stringify(event.meta_data || {})})
        `;
        insertedCount++;
      } catch (err) {
        console.error('Failed to insert event:', err);
        // Continue with other events even if one fails
      }
    }

    console.log(`✅ Tracked ${insertedCount} events for employee ${employee_id}`);

    res.status(200).json({ 
      success: true, 
      tracked: insertedCount 
    });
  } catch (error) {
    console.error('❌ Event tracking error:', error);
    
    // Return 200 even on error to not break client
    // Client should continue working even if tracking fails
    res.status(200).json({ 
      success: false, 
      error: 'Failed to track events' 
    });
  }
});

/**
 * GET /api/v1/events/analytics/summary
 * 
 * Get event analytics summary for an employee
 * 
 * Query params:
 * - employee_id: Employee ID
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 */
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date } = req.query;
    
    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id is required' });
    }

    // Build date filter
    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `AND entry_date BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (start_date) {
      dateFilter = `AND entry_date >= '${start_date}'`;
    } else if (end_date) {
      dateFilter = `AND entry_date <= '${end_date}'`;
    }

    const eventCounts = await prisma.$queryRawUnsafe(`
      SELECT 
        event_name,
        COUNT(*) as count,
        DATE(entry_date) as date
      FROM SA_ExecutiveAppEvents
      WHERE employee_id = '${employee_id}'
        ${dateFilter}
      GROUP BY event_name, DATE(entry_date)
      ORDER BY date DESC, count DESC
    `);
    
    res.json({ 
      success: true,
      employee_id,
      events: eventCounts 
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch analytics' 
    });
  }
});

/**
 * GET /api/v1/events/analytics/top-events
 * 
 * Get most frequent events across all users
 * 
 * Query params:
 * - limit: Number of top events to return (default: 10)
 * - days: Number of days to look back (default: 7)
 */
router.get('/analytics/top-events', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 7;
    
    const topEvents = await prisma.$queryRawUnsafe(`
      SELECT 
        event_name,
        COUNT(*) as total_count,
        COUNT(DISTINCT employee_id) as unique_users
      FROM SA_ExecutiveAppEvents
      WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      GROUP BY event_name
      ORDER BY total_count DESC
      LIMIT ${limit}
    `);
    
    res.json({ 
      success: true,
      top_events: topEvents,
      period_days: days
    });
  } catch (error) {
    console.error('Top events error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch top events' 
    });
  }
});

/**
 * GET /api/v1/events/analytics/user-activity
 * 
 * Get daily active users count
 * 
 * Query params:
 * - days: Number of days to look back (default: 30)
 */
router.get('/analytics/user-activity', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const dailyActivity = await prisma.$queryRawUnsafe(`
      SELECT 
        DATE(entry_date) as date,
        COUNT(DISTINCT employee_id) as active_users,
        COUNT(*) as total_events
      FROM SA_ExecutiveAppEvents
      WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      GROUP BY DATE(entry_date)
      ORDER BY date DESC
    `);
    
    res.json({ 
      success: true,
      daily_activity: dailyActivity,
      period_days: days
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user activity' 
    });
  }
});

export default router;

