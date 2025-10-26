# Deployment Guide for Sales App

## 🎯 Deployment Architecture

**Frontend** → Vercel (Optimal)
**Backend** → Render (Express.js + MySQL)
**Database** → Existing MySQL (116.202.114.156:3971)

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render

1. **Sign up** at [Render.com](https://render.com)
2. **Create new Web Service** → Connect GitHub repository
3. **Select your repository**
4. **Configure**:
   ```
   Name: sales-app-backend
   Environment: Node
   Root Directory: apps/backend
   Build Command: pnpm install && pnpm run build
   Start Command: pnpm start
   Instance Type: Starter (Free) or Standard ($7/month)
   ```
5. **Environment Variables**:
   ```
   DATABASE_URL=mysql://datalake_trw:Tedd@13332!wq23@116.202.114.156:3971/datalake
   JWT_SECRET=dev_super_secret_change_me_please_0123456789
   JWT_REFRESH_SECRET=dev_refresh_secret_change_me_please_9876543210
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Step 2: Deploy Frontend to Vercel

1. **Sign up** at [Vercel](https://vercel.com)
2. **Import your GitHub repository**
3. **Configure**:
   ```
   Framework Preset: Vite
   Root Directory: apps/frontend
   Build Command: pnpm run build
   Output Directory: dist
   ```
4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/v1
   VITE_WS_URL=https://your-backend.onrender.com
   ```

### Step 3: Update Frontend API Configuration

Update `apps/frontend/src/shared/api.ts`:

```typescript
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'https://your-backend.onrender.com/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: () => ({}),
});
```

Update `apps/frontend/src/shared/useWebSocket.ts`:

```typescript
socketRef.current = io(import.meta.env.VITE_WS_URL || 'https://your-backend.onrender.com', {
  auth: { token },
});
```

---

## 🔧 Backend Modifications for Deployment

### 1. Update `apps/backend/src/server.ts`

```typescript
// Add CORS configuration for production
import cors from 'cors';

// In your app setup:
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://your-app.vercel.app',
    'http://localhost:5173' // For local development
  ],
  credentials: true
}));

// Update Socket.io CORS
const io = new IOServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'https://your-app.vercel.app',
      'http://localhost:5173' // For local development
    ],
    credentials: true
  }
});
```

### 2. Update `apps/backend/package.json`

```json
{
  "scripts": {
    "dev": "ts-node-dev --transpile-only --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prepare": "prisma generate"
  }
}
```

### 3. Create Production Build Script

Create `apps/backend/scripts/build.sh`:

```bash
#!/bin/bash
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔨 Building TypeScript..."
pnpm run build

echo "✅ Build complete!"
```

---

## 🚀 Option 2: Vercel Full Deployment (Alternative)

### Prerequisites

- Convert Express.js backend to Vercel Serverless Functions
- Database accessible from public internet (or use VPN)

### Steps

1. **Structure for Vercel**:
   ```
   apps/
     backend/
       api/
         auth/
           [...route].ts  # Handles /api/v1/auth/*
         dashboard/
           [...route].ts  # Handles /api/v1/dashboard/*
         ...
   ```

2. **Convert Express Routes to Serverless Functions**:

Example: `apps/backend/api/dashboard/summary.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authMiddleware } from '../../src/middleware/auth';
import { getPrisma } from '../../src/lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Auth check
    const auth = await authMiddleware(req, res);
    if (!auth) return;

    const employeeId = req.query.employeeId as string;
    // ... rest of your logic
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

---

## 🌐 DNS Configuration

1. **Backend** (Render):
   - Render provides: `your-backend.onrender.com`
   - Or configure custom domain: `api.yourdomain.com`

2. **Frontend** (Vercel):
   - Vercel provides: `your-app.vercel.app`
   - Or configure custom domain: `app.yourdomain.com`

3. **CORS Setup**:
   Update backend CORS to include your Vercel domain:
   ```typescript
   origin: [
     'https://your-app.vercel.app',
     'https://app.yourdomain.com'
   ]
   ```

---

## 🔒 Security Considerations

1. **Database Access**:
   - Current DB: `116.202.114.156:3971`
   - **Ensure it's accessible** from Render's IP range
   - Or use **private networking** if available

2. **Environment Variables**:
   - ✅ Never commit `.env` files
   - ✅ Use Render/Vercel environment variable secrets
   - ✅ Rotate `JWT_SECRET` for production

3. **Rate Limiting**:
   - Already implemented in your middleware
   - Consider adding Cloudflare for DDoS protection

4. **HTTPS**:
   - Vercel provides automatic HTTPS
   - Render provides automatic HTTPS
   - Both use Let's Encrypt certificates

---

## 📊 Monitoring

### Vercel Analytics (Frontend)
- Built-in analytics
- Real-time logs
- Function execution logs

### Render Monitoring (Backend)
- Application logs
- Metrics dashboard
- Resource usage

### Recommended: Add Sentry

```bash
# Backend
pnpm add @sentry/node

# Frontend  
pnpm add @sentry/react
```

---

## 💰 Cost Estimation

### Vercel (Frontend)
- **Hobby Plan**: Free (with limits)
- **Pro Plan**: $20/month

### Render (Backend)
- **Starter Plan**: Free (with limits)
- **Standard Plan**: $7/month
- **Pro Plan**: $25/month

**Total Estimate**: $0 (Starter) to $45/month (Pro)

---

## 🚀 Quick Deploy Commands

### Render (Backend)
```bash
cd apps/backend
# Deploy via Render Dashboard (GitHub integration)
# Or use Render CLI:
npm install -g @render/cli
render login
render deploy
```

### Vercel (Frontend)
```bash
cd apps/frontend
npm install -g vercel
vercel login
vercel --prod
```

---

## ✅ Deployment Checklist

- [ ] Database accessible from hosting platform
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] HTTPS enabled (automatic)
- [ ] Error tracking setup (Sentry)
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Custom domain configured
- [ ] SSL certificates working
- [ ] All tests passing

---

## 📝 Notes

1. **Current Setup**: Uses MySQL on `116.202.114.156:3971`
   - Ensure this DB is accessible from cloud platforms
   - Or migrate to a managed database service

2. **Real-time Features**: WebSocket connections
   - Render supports WebSocket
   - Ensure persistent connections are maintained

3. **Background Jobs**: Cron jobs (node-cron)
   - Render has cron support
   - Vercel functions have timeout limits (max 5 minutes)

---

## 🆘 Troubleshooting

### Backend not connecting to database
- Check firewall rules for database server
- Verify DATABASE_URL is correct
- Check database server allows external connections

### Frontend showing 404 on routes
- Configure rewrites in `vercel.json`
- Ensure React Router is configured for client-side routing

### WebSocket connection failing
- Check CORS configuration
- Verify Socket.io server is running
- Check if hosting platform supports WebSockets
