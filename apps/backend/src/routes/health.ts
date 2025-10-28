import { Router } from 'express';
import { getPrisma } from '../lib/prisma';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
