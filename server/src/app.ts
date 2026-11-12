import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import healthRoutes from './routes/healthRoutes.js';
import v1Routes from './routes/v1Routes.js';

export interface CreateAppOptions {
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });

  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => Boolean(origin) && origin !== '*');

  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.use(
    '/api',
    createRateLimiter({
      windowMs: options.rateLimitWindowMs ?? 60_000,
      maxRequests: options.rateLimitMax ?? 300,
    })
  );

  app.use('/api', healthRoutes);
  app.use('/api/v1', v1Routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

