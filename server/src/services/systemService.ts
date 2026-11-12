import { getDatabaseHealth } from '../config/db.js';
import { env } from '../config/env.js';
import type { HealthResponse, SystemStatusResponse } from '../types/system.js';

const SERVICE_NAME = 'GreenGrid India API';
const SERVICE_VERSION = '0.1.0';

export function buildHealthPayload(): HealthResponse {
  const database = getDatabaseHealth();
  const isDbHealthy = database.connected;

  return {
    service: SERVICE_NAME,
    status: isDbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    database,
  };
}

export function buildSystemStatusPayload(): SystemStatusResponse {
  const database = getDatabaseHealth();

  return {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    apiStatus: 'operational',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database,
    features: {
      milestone: '01-foundation',
      modulesReady: false,
      reaIngestionReady: false,
      digitalTwinReady: false,
    },
  };
}

