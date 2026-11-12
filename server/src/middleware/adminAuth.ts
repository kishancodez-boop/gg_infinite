import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

/**
 * Fail-closed guard for privileged write/delete endpoints.
 * When ADMIN_API_KEY is unconfigured, all write routes are disabled (403).
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = env.ADMIN_API_KEY;
  if (!configuredKey) {
    res.status(403).json({
      error: {
        code: 'ADMIN_AUTH_NOT_CONFIGURED',
        message:
          'Privileged write operations are disabled until admin authentication is configured on the server.',
      },
    });
    return;
  }

  const provided = req.header('x-admin-key');
  if (!provided) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing admin credentials.',
      },
    });
    return;
  }

  const expectedBuf = Buffer.from(configuredKey, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');

  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid admin credentials.',
      },
    });
    return;
  }

  next();
}

