import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import v1Routes from './routes/v1Routes.js';

export function createApp() {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', healthRoutes);
  app.use('/api/v1', v1Routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

