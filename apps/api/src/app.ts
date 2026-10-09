import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';

import { env } from './config/env';
import { initSocket } from './config/socket';
import { errorHandler } from './shared/middleware/error-handler';
import { rateLimiter } from './shared/middleware/rate-limiter';

// ─── Route Imports ───────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import guestRoutes from './modules/guests/guests.routes';
import roomRoutes from './modules/rooms/rooms.routes';
import roomTypeRoutes from './modules/room-types/room-types.routes';
import ratePlanRoutes from './modules/rate-plans/rate-plans.routes';
import reservationRoutes from './modules/reservations/reservations.routes';
import frontDeskRoutes from './modules/front-desk/front-desk.routes';
import housekeepingRoutes from './modules/housekeeping/housekeeping.routes';
import billingRoutes from './modules/billing/billing.routes';
import nightAuditRoutes from './modules/night-audit/night-audit.routes';
import reportRoutes from './modules/reports/reports.routes';

const app = express();
const httpServer = createServer(app);

// ─── Initialize Socket.IO ────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/guests`, guestRoutes);
app.use(`${API}/rooms`, roomRoutes);
app.use(`${API}/room-types`, roomTypeRoutes);
app.use(`${API}/rate-plans`, ratePlanRoutes);
app.use(`${API}/reservations`, reservationRoutes);
app.use(`${API}/front-desk`, frontDeskRoutes);
app.use(`${API}/housekeeping`, housekeepingRoutes);
app.use(`${API}/billing`, billingRoutes);
app.use(`${API}/night-audit`, nightAuditRoutes);
app.use(`${API}/reports`, reportRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
httpServer.listen(env.PORT, () => {
  console.log(`🚀 HMS API running on http://localhost:${env.PORT}`);
});

export default app;
