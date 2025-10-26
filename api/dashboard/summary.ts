import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    // Mock data for now - replace with real database queries later
    const summary = {
      dailyProgress: 75,
      weeklyProgress: 60,
      dailyPercent: 75,
      weeklyPercent: 60,
      dailyTarget: 100,
      weeklyTarget: 500,
      dailyVariablePay: 750,
      weeklyVariablePay: 3000,
      achievementCount: 3
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
