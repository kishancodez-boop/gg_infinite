import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env } from '../config/env.js';
import { PolicySchemeModel } from '../models/index.js';
import * as domainService from '../services/domainService.js';

const MOCK_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

describe('Milestone 06 — Policies & Schemes Backend API', () => {
  const app = createApp();
  const originalAdminKey = env.ADMIN_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = originalAdminKey;
  });

  it('returns 503 DATABASE_UNAVAILABLE when MongoDB is disconnected', async () => {
    const endpoints = [
      request(app).get('/api/v1/policies'),
      request(app).get(`/api/v1/policies/${MOCK_ID}`),
      request(app).get('/api/v1/schemes'),
      request(app).get(`/api/v1/schemes/${MOCK_ID}`),
      request(app).post('/api/v1/policies').send({}),
      request(app).post('/api/v1/schemes').send({}),
    ];

    for (const reqPromise of endpoints) {
      const res = await reqPromise;
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    }
  });

  it('validates query and route params with Zod (400 VALIDATION_ERROR)', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const badQueryRes = await request(app).get('/api/v1/policies?status=invalid_status');
    expect(badQueryRes.status).toBe(400);
    expect(badQueryRes.body.error.code).toBe('VALIDATION_ERROR');

    const badIdRes = await request(app).get('/api/v1/schemes/not-an-object-id');
    expect(badIdRes.status).toBe(400);
    expect(badIdRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists policies and schemes with search, filters, pagination, and recordKind=all', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    const listSpy = vi
      .spyOn(domainService, 'listPoliciesOrSchemes')
      .mockResolvedValue({
        data: [
          {
            _id: MOCK_ID,
            title: 'PM-KUSUM (DEMO)',
            recordKind: 'scheme',
            isDemoData: true,
          } as never,
        ],
        meta: {
          pagination: {
            page: 2,
            limit: 5,
            total: 12,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: true,
          },
        },
      });

    const policyRes = await request(app).get(
      '/api/v1/policies?page=2&limit=5&search=solar&technology=solar&schemeCategory=subsidy&jurisdiction=state&stateOrRegion=Rajasthan&issuingOrganization=MNRE&status=active&dataMode=all&recordKind=all'
    );
    expect(policyRes.status).toBe(200);
    expect(policyRes.body.data).toHaveLength(1);
    expect(policyRes.body.meta.pagination.page).toBe(2);
    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 5,
        search: 'solar',
        technology: 'solar',
        schemeCategory: 'subsidy',
        jurisdiction: 'state',
        stateOrRegion: 'Rajasthan',
        issuingOrganization: 'MNRE',
        status: 'active',
        dataMode: 'all',
        recordKind: 'all',
      }),
      'policy'
    );

    const schemeRes = await request(app).get('/api/v1/schemes?status=active');
    expect(schemeRes.status).toBe(200);
    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'active' }),
      'scheme'
    );
  });

  it('returns detail for existing policy/scheme and 404 for missing records', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    vi.spyOn(PolicySchemeModel, 'findOne').mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: MOCK_ID,
          title: 'National Solar Mission',
          recordKind: 'policy',
        }),
      }),
    } as never);

    const okRes = await request(app).get(`/api/v1/policies/${MOCK_ID}`);
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.title).toBe('National Solar Mission');

    vi.spyOn(PolicySchemeModel, 'findOne').mockReturnValueOnce({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as never);

    const notFoundRes = await request(app).get(`/api/v1/schemes/${MOCK_ID}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('protects POST /policies and POST /schemes with fail-closed requireAdminAuth', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = undefined;

    for (const path of ['/api/v1/policies', '/api/v1/schemes']) {
      const unconfigured = await request(app).post(path).send({});
      expect(unconfigured.status).toBe(403);
      expect(unconfigured.body.error.code).toBe('ADMIN_AUTH_NOT_CONFIGURED');
    }

    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = 'secret-m06-key';
    const missingKey = await request(app).post('/api/v1/policies').send({});
    expect(missingKey.status).toBe(401);
    expect(missingKey.body.error.code).toBe('UNAUTHORIZED');

    const badKey = await request(app)
      .post('/api/v1/schemes')
      .set('x-admin-key', 'wrong')
      .send({});
    expect(badKey.status).toBe(403);
    expect(badKey.body.error.code).toBe('FORBIDDEN');
  });
});

