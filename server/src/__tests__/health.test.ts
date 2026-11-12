import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { parseEnv } from '../config/env.js';

describe('Health & System Status API', () => {
  const app = createApp();

  it('GET /api/health returns service info and accurate disconnected/unconfigured DB status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('GreenGrid India API');
    expect(response.body.timestamp).toBeTypeOf('string');
    expect(response.body.database).toMatchObject({
      connected: false,
      configured: false,
      status: 'unconfigured',
      readyState: 0,
    });
    expect(response.body.status).toBe('degraded');
  });

  it('GET /api/v1/system/status returns API operational status and milestone metadata', async () => {
    const response = await request(app).get('/api/v1/system/status');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      service: 'GreenGrid India API',
      apiStatus: 'operational',
      database: {
        connected: false,
        status: 'unconfigured',
      },
      features: {
        milestone: '01-foundation',
        modulesReady: false,
        reaIngestionReady: false,
        digitalTwinReady: false,
      },
    });
  });

  it('GET /api/v1/system/status rejects invalid query parameters via Zod middleware', async () => {
    const response = await request(app).get('/api/v1/system/status?detail=invalid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 JSON for unknown routes', async () => {
    const response = await request(app).get('/api/v1/non-existent');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('validates MONGODB_URI prefix when provided', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'test',
        PORT: '5000',
        MONGODB_URI: 'http://invalid-protocol',
      })
    ).toThrow(/MONGODB_URI/);
  });
});

