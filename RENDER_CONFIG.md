# Render Configuration for Sales App Backend

## Render Blueprint (render.yaml)

Create `apps/backend/render.yaml`:

```yaml
services:
  - type: web
    name: sales-app-backend
    env: node
    plan: starter
    buildCommand: pnpm install && pnpm run build
    startCommand: pnpm start
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false  # Set manually in Render dashboard
      - key: JWT_SECRET
        sync: false  # Set manually in Render dashboard
      - key: JWT_REFRESH_SECRET
        sync: false  # Set manually in Render dashboard
      - key: FRONTEND_URL
        sync: false  # Set manually in Render dashboard
```

## Package.json Updates

Ensure `apps/backend/package.json` has:

```json
{
  "scripts": {
    "dev": "ts-node-dev --transpile-only --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prepare": "prisma generate"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## Health Check Endpoint

Add to `apps/backend/src/routes/health.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
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
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

Then add to `apps/backend/src/server.ts`:

```typescript
import healthRouter from './routes/health';

// Add health check route
app.use('/api/v1', healthRouter);
```
