import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { checkDatabase } from './config/db.js';
import { logger } from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { AppError } from './middleware/errorHandler.js';
import gymRoutes from './routes/gymRoutes.js';
import userRoutes from './routes/userRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import classRoutes from './routes/classRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import gymApplicationRoutes from './routes/gymApplicationRoutes.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use(morgan('combined', { stream: { write: (message) => logger.http(message.trim()) } }));
app.use('/uploads', express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nuragym-api' });
});

app.get('/api/health', async (_req, res, next) => {
  try {
    await checkDatabase();
    res.json({ status: 'ok', server: 'ok', database: 'connected' });
  } catch (error) {
    next(new AppError(
      'MySQL connection failed. Check that MySQL is running and DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME are correct.',
      503,
      { code: error.code }
    ));
  }
});

app.use('/api/gyms', gymRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/checkins', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', gymApplicationRoutes);

app.use(notFound);
app.use(errorHandler);
