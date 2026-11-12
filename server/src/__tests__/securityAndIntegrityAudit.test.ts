import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env, parseEnv } from '../config/env.js';
import { DataSourceModel, StagedRecordModel } from '../models/index.js';
import { validateFetchUrl } from '../services/rea/permissionGuard.js';
import { publishApprovedStagedRecord } from '../services/rea/reviewService.js';

describe('Milestone 14 — Security & Data Integrity Audit', () => {
  const originalAdminKey = env.ADMIN_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = originalAdminKey;
  });

  it('sets defensive security headers and hides X-Powered-By', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
  });

  it('enforces API rate limiting with 429 RATE_LIMIT_EXCEEDED', async () => {
    const app = createApp({ rateLimitMax: 2, rateLimitWindowMs: 60_000 });

    const r1 = await request(app).get('/api/health');
    const r2 = await request(app).get('/api/health');
    const r3 = await request(app).get('/api/health');

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
    expect(r3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('fails closed (403/401) on every privileged write and sensitive read route', async () => {
    const app = createApp();
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    // 1) Missing ADMIN_API_KEY -> 403 ADMIN_AUTH_NOT_CONFIGURED
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = undefined;
    const writeRoutes: Array<{ method: 'post' | 'patch' | 'delete' | 'get'; path: string }> = [
      { method: 'post', path: '/api/v1/metrics' },
      { method: 'post', path: '/api/v1/ingestion-runs' },
      { method: 'post', path: '/api/v1/sources' },
      { method: 'patch', path: '/api/v1/sources/507f1f77bcf86cd799439011' },
      { method: 'delete', path: '/api/v1/sources/507f1f77bcf86cd799439011' },
      { method: 'post', path: '/api/v1/policies' },
      { method: 'post', path: '/api/v1/schemes' },
      { method: 'post', path: '/api/v1/rpo' },
      { method: 'post', path: '/api/v1/finance' },
      { method: 'post', path: '/api/v1/jobs' },
      { method: 'post', path: '/api/v1/rea/ingest' },
      { method: 'get', path: '/api/v1/rea/review-queue' },
      { method: 'get', path: '/api/v1/rea/audit-logs' },
      { method: 'get', path: '/api/v1/calculator/history' },
      { method: 'post', path: '/api/v1/calculator/history' },
    ];

    for (const route of writeRoutes) {
      const res = await request(app)[route.method](route.path).send({});
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ADMIN_AUTH_NOT_CONFIGURED');
    }

    // 2) Configured ADMIN_API_KEY, missing header -> 401 UNAUTHORIZED
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = 'strong-secret-key';
    const unauthMetrics = await request(app).post('/api/v1/metrics').send({});
    expect(unauthMetrics.status).toBe(401);
    expect(unauthMetrics.body.error.code).toBe('UNAUTHORIZED');

    // 3) Invalid header -> 403 FORBIDDEN
    const badMetrics = await request(app)
      .post('/api/v1/metrics')
      .set('x-admin-key', 'wrong-key')
      .send({});
    expect(badMetrics.status).toBe(403);
    expect(badMetrics.body.error.code).toBe('FORBIDDEN');
  });

  it('blocks SSRF targets, non-HTTPS URLs, credentials in URLs, and unallowlisted domains', () => {
    const allowed = ['cea.nic.in', 'mnre.gov.in'];

    expect(validateFetchUrl('http://cea.nic.in/data.json', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://localhost/admin', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://127.0.0.1/secret', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://169.254.169.254/latest/meta-data/', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://10.0.0.5/internal', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://192.168.1.1/router', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://[::1]/loopback', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://user:pass@cea.nic.in/data.json', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://evil.example.com/data.json', allowed).valid).toBe(false);
    expect(validateFetchUrl('https://api.cea.nic.in/data.json', allowed).valid).toBe(true);
  });

  it('blocks publishing unapproved, rejected, or invalid staged records', async () => {
    vi.spyOn(StagedRecordModel, 'findById').mockResolvedValueOnce({
      _id: 's1',
      reviewStatus: 'pending_review',
      provenance: { verificationStatus: 'verified' },
      proposedData: { value: 100 },
    } as never);
    await expect(publishApprovedStagedRecord('s1')).rejects.toThrow(/Human approval is required/);

    vi.spyOn(StagedRecordModel, 'findById').mockResolvedValueOnce({
      _id: 's2',
      reviewStatus: 'rejected',
      provenance: { verificationStatus: 'verified' },
      proposedData: { value: 100 },
    } as never);
    await expect(publishApprovedStagedRecord('s2')).rejects.toThrow(/Human approval is required/);

    vi.spyOn(StagedRecordModel, 'findById').mockResolvedValueOnce({
      _id: 's3',
      reviewStatus: 'approved',
      provenance: { verificationStatus: 'rejected' },
      proposedData: { value: 100 },
    } as never);
    await expect(publishApprovedStagedRecord('s3')).rejects.toThrow(/rejected provenance/);
  });

  it('returns 409 DUPLICATE_RESOURCE on Mongo duplicate key errors when authorized', async () => {
    const app = createApp();
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = 'strong-secret-key';

    vi.spyOn(DataSourceModel, 'create').mockRejectedValue({ code: 11000 });

    const res = await request(app)
      .post('/api/v1/sources')
      .set('x-admin-key', 'strong-secret-key')
      .send({
        sourceName: 'CEA Installed Capacity',
        organization: 'Central Electricity Authority',
        domain: 'cea.nic.in',
        sourceUrl: 'https://cea.nic.in',
        sourceType: 'central_ministry',
        dataCategory: 'capacity_generation',
        accessMethod: 'csv',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('rejects wildcard CORS_ORIGIN in production environment validation', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        PORT: '10000',
        CORS_ORIGIN: '*',
      })
    ).toThrow(/Wildcard "\*" is not permitted/);
  });
});
