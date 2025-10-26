#!/bin/bash

# Sales App Deployment Script
# Backend: Render
# Frontend: Vercel

echo "🚀 Sales App Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Backend configured for Render"
echo "2. ✅ Frontend configured for Vercel"
echo "3. ✅ Health check endpoint added"
echo "4. ✅ CORS configured for production"
echo "5. ✅ Environment variables documented"

echo ""
echo "🔧 Next steps:"
echo ""
echo "BACKEND (Render):"
echo "1. Go to https://render.com"
echo "2. Create new Web Service"
echo "3. Connect GitHub repository"
echo "4. Configure:"
echo "   - Name: sales-app-backend"
echo "   - Environment: Node"
echo "   - Root Directory: apps/backend"
echo "   - Build Command: pnpm install && pnpm run build"
echo "   - Start Command: pnpm start"
echo "5. Set environment variables:"
echo "   - DATABASE_URL=mysql://datalake_trw:Tedd@13332!wq23@116.202.114.156:3971/datalake"
echo "   - JWT_SECRET=your-production-secret"
echo "   - JWT_REFRESH_SECRET=your-refresh-secret"
echo "   - FRONTEND_URL=https://your-app.vercel.app"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo ""
echo "FRONTEND (Vercel):"
echo "1. Go to https://vercel.com"
echo "2. Import GitHub repository"
echo "3. Configure:"
echo "   - Framework: Vite"
echo "   - Root Directory: apps/frontend"
echo "   - Build Command: pnpm run build"
echo "   - Output Directory: dist"
echo "4. Set environment variables:"
echo "   - VITE_API_URL=https://your-backend.onrender.com/api/v1"
echo "   - VITE_WS_URL=https://your-backend.onrender.com"
echo ""
echo "🌐 After deployment:"
echo "1. Update FRONTEND_URL in Render with your Vercel URL"
echo "2. Test the health check: https://your-backend.onrender.com/api/v1/health"
echo "3. Test the frontend: https://your-app.vercel.app"
echo ""
echo "📊 Monitoring:"
echo "- Render Dashboard: Monitor backend logs and metrics"
echo "- Vercel Dashboard: Monitor frontend deployments"
echo ""
echo "✅ Ready for deployment!"
