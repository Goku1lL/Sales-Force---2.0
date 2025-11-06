import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import authRouter from './routes/auth';
import targetsRouter from './routes/targets';
import dashboardRouter from './routes/dashboard';
import leaderboardRouter from './routes/leaderboard';
import customersRouter from './routes/customers';
import incentivesRouter from './routes/incentives';
import achievementsRouter from './routes/achievements';
import eventsRouter from './routes/events';
import healthRouter from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';

const app = express();

app.use(helmet());
// Temporary: Allow all origins to test
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(rateLimit);
app.use(json());
app.use(urlencoded({ extended: true }));

// Health check
app.use('/api/v1', healthRouter);

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/targets', targetsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/incentives', incentivesRouter);
app.use('/api/v1/achievements', achievementsRouter);
app.use('/api/v1/events', eventsRouter);

// Error handler
app.use(errorHandler);

export default app;
