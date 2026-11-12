import type { NextFunction, Request, Response } from 'express';
import { getDatabaseHealth, isDatabaseConnected } from '../config/db.js';

/**
 * Guards database-backed endpoints so they fail fast with 503 Service Unavailable
 * when MongoDB is not configured or not connected, instead of hanging on buffered queries.
 */
export function requireDatabase(_req: Request, res: Response, next: NextFunction): void {
  if (isDatabaseConnected()) {
    next();
    return;
  }

  const database = getDatabaseHealth();
  res.status(503).json({
    error: {
      code: 'DATABASE_UNAVAILABLE',
      message: database.configured
        ? 'MongoDB is configured but currently disconnected. Check your database server or URI.'
        : 'MongoDB is not configured. Set MONGODB_URI in server/.env to enable database persistence.',
      database,
    },
  });
}

