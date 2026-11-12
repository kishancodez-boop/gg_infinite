import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env } from '../config/env.js';
import { OFFICIAL_SOURCE_CATALOGUE } from '../data/sourceCatalogue.js';
import {
  DataSourceModel,
  EnergyMetricModel,
  IngestionRunModel,
  PolicySchemeModel,
  RpoRecordModel,
} from '../models/index.js';
import { createSourceSchema } from '../schemas/domainSchemas.js';

const app = createApp();
const validObjectId = new mongoose.Types.ObjectId().toString();

function mockFindChain<T>(items: T[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(items),
  };
}

afterEach(() => {
  env.ADMIN_API_KEY = undefined;
  vi.restoreAllMocks();
});

describe('Database Availability & Honest 503 Reporting', () => {
  it('returns 503 DATABASE_UNAVAILABLE for /api/v1 domain endpoints when MongoDB is disconnected', async () => {
    const endpoints = [
      '/api/v1/sources',
      '/api/v1/metrics',
      '/api/v1/policies',
      '/api/v1/schemes',
      '/api/v1/rpo',
      '/api/v1/ingestion-runs',
    ];

    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
      expect(res.body.error.database.connected).toBe(false);
    }
  });

  it('keeps /api/health and /api/v1/system/status operational without MongoDB', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.database.connected).toBe(false);

    const status = await request(app).get('/api/v1/system/status');
    expect(status.status).toBe(200);
    expect(status.body.apiStatus).toBe('operational');
  });
});

describe('/api/v1 Domain Routes (Validation, Pagination, Filtering & Demo Separation)', () => {
  it('enforces dataMode=verified by default on GET /api/v1/metrics and computes pagination meta', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const sampleMetrics = [
      { _id: validObjectId, metricName: 'Solar Capacity', value: 50, unit: 'GW', isDemoData: false },
    ];
    const findSpy = vi
      .spyOn(EnergyMetricModel, 'find')
      .mockReturnValue(mockFindChain(sampleMetrics) as never);
    vi.spyOn(EnergyMetricModel, 'countDocuments').mockResolvedValue(25);

    const res = await request(app).get(
      '/api/v1/metrics?page=2&limit=10&geographicScope=national&sortBy=value&sortOrder=asc'
    );

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({
      isDemoData: false,
      geographicScope: 'national',
    });
    expect(res.body.meta).toEqual({
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      },
      dataMode: 'verified',
      containsDemoData: false,
    });
  });

  it('filters demo records when dataMode=demo is explicitly requested', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const demoSource = [
      { _id: validObjectId, sourceName: '[DEMO] Sample', isDemoData: true },
    ];
    const findSpy = vi
      .spyOn(DataSourceModel, 'find')
      .mockReturnValue(mockFindChain(demoSource) as never);
    vi.spyOn(DataSourceModel, 'countDocuments').mockResolvedValue(1);

    const res = await request(app).get('/api/v1/sources?dataMode=demo');

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({ isDemoData: true });
    expect(res.body.meta.dataMode).toBe('demo');
    expect(res.body.meta.containsDemoData).toBe(true);
  });

  it('separates /api/v1/policies and /api/v1/schemes via recordKind filter', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const findSpy = vi
      .spyOn(PolicySchemeModel, 'find')
      .mockReturnValue(mockFindChain([]) as never);
    vi.spyOn(PolicySchemeModel, 'countDocuments').mockResolvedValue(0);

    const pRes = await request(app).get('/api/v1/policies?category=solar');
    expect(pRes.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({
      isDemoData: false,
      recordKind: 'policy',
      category: 'solar',
    });

    const sRes = await request(app).get('/api/v1/schemes?jurisdiction=state');
    expect(sRes.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({
      isDemoData: false,
      recordKind: 'scheme',
      jurisdiction: 'state',
    });
  });

  it('supports GET /api/v1/rpo and GET /api/v1/ingestion-runs filtering', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const rpoFindSpy = vi
      .spyOn(RpoRecordModel, 'find')
      .mockReturnValue(mockFindChain([]) as never);
    vi.spyOn(RpoRecordModel, 'countDocuments').mockResolvedValue(0);

    const rpoRes = await request(app).get('/api/v1/rpo?compliancePeriod=FY2025-26&category=solar');
    expect(rpoRes.status).toBe(200);
    expect(rpoFindSpy).toHaveBeenCalledWith({
      isDemoData: false,
      compliancePeriod: 'FY2025-26',
      category: 'solar',
    });

    const runFindSpy = vi
      .spyOn(IngestionRunModel, 'find')
      .mockReturnValue(mockFindChain([]) as never);
    vi.spyOn(IngestionRunModel, 'countDocuments').mockResolvedValue(0);

    const runRes = await request(app).get('/api/v1/ingestion-runs?status=dry_run');
    expect(runRes.status).toBe(200);
    expect(runFindSpy).toHaveBeenCalledWith({
      isDemoData: false,
      status: 'dry_run',
    });
  });

  it('blocks unauthorized write/update/delete operations on /api/v1/sources', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const postNoAuth = await request(app).post('/api/v1/sources').send({
      sourceName: 'Test',
      organization: 'Org',
      sourceUrl: 'https://example.org/test',
      sourceType: 'other',
      accessMethod: 'manual',
    });
    expect(postNoAuth.status).toBe(403);
    expect(postNoAuth.body.error.code).toBe('ADMIN_AUTH_NOT_CONFIGURED');

    const patchNoAuth = await request(app)
      .patch(`/api/v1/sources/${validObjectId}`)
      .send({ active: false });
    expect(patchNoAuth.status).toBe(403);

    const deleteNoAuth = await request(app).delete(`/api/v1/sources/${validObjectId}`);
    expect(deleteNoAuth.status).toBe(403);

    env.ADMIN_API_KEY = 'secret-admin-key';
    const missingHeader = await request(app).delete(`/api/v1/sources/${validObjectId}`);
    expect(missingHeader.status).toBe(401);

    const wrongHeader = await request(app)
      .delete(`/api/v1/sources/${validObjectId}`)
      .set('x-admin-key', 'wrong-key');
    expect(wrongHeader.status).toBe(403);
  });

  it('returns 400 VALIDATION_ERROR for invalid ObjectId params, query params, and authorized body', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    env.ADMIN_API_KEY = 'secret-admin-key';

    const badId = await request(app).get('/api/v1/sources/not-an-object-id');
    expect(badId.status).toBe(400);
    expect(badId.body.error.code).toBe('VALIDATION_ERROR');

    const badQuery = await request(app).get('/api/v1/metrics?limit=500');
    expect(badQuery.status).toBe(400);
    expect(badQuery.body.error.code).toBe('VALIDATION_ERROR');

    const badBody = await request(app)
      .post('/api/v1/sources')
      .set('x-admin-key', 'secret-admin-key')
      .send({
        sourceName: 'A',
        sourceUrl: 'invalid-url',
      });
    expect(badBody.status).toBe(400);
    expect(badBody.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('supports dataCategory and verificationStatus filtering on GET /api/v1/sources', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    const findSpy = vi
      .spyOn(DataSourceModel, 'find')
      .mockReturnValue(mockFindChain([]) as never);
    vi.spyOn(DataSourceModel, 'countDocuments').mockResolvedValue(0);

    const res = await request(app).get(
      '/api/v1/sources?dataCategory=policies_schemes&verificationStatus=verified&active=true'
    );
    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({
      isDemoData: false,
      dataCategory: 'policies_schemes',
      verificationStatus: 'verified',
      active: true,
    });
  });

  it('returns 404 RESOURCE_NOT_FOUND when a record does not exist and 409 on duplicate key when authorized', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    env.ADMIN_API_KEY = 'secret-admin-key';

    vi.spyOn(DataSourceModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as never);

    const notFound = await request(app).get(`/api/v1/sources/${validObjectId}`);
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe('RESOURCE_NOT_FOUND');

    vi.spyOn(DataSourceModel, 'create').mockRejectedValue({ code: 11000 });
    const duplicate = await request(app)
      .post('/api/v1/sources')
      .set('x-admin-key', 'secret-admin-key')
      .send({
        sourceName: 'Valid Source',
        organization: 'Valid Org',
        sourceUrl: 'https://example.org/valid',
        sourceType: 'public_open_data',
        accessMethod: 'csv',
      });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_RESOURCE');

    vi.spyOn(DataSourceModel, 'findByIdAndUpdate').mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: validObjectId, active: false }),
    } as never);
    const patched = await request(app)
      .patch(`/api/v1/sources/${validObjectId}`)
      .set('x-admin-key', 'secret-admin-key')
      .send({ active: false });
    expect(patched.status).toBe(200);
    expect(patched.body.data.active).toBe(false);
  });

  it('validates OFFICIAL_SOURCE_CATALOGUE uniqueness and verified vs candidate separation', () => {
    const urls = OFFICIAL_SOURCE_CATALOGUE.map((s) => s.sourceUrl);
    expect(new Set(urls).size).toBe(urls.length);

    for (const entry of OFFICIAL_SOURCE_CATALOGUE) {
      const parsed = createSourceSchema.parse(entry);
      expect(parsed.isDemoData).toBe(false);
      expect(parsed.lastCheckedAt).toBeInstanceOf(Date);
      const doc = new DataSourceModel(parsed);
      expect(doc.validateSync()).toBeUndefined();
    }

    const verified = OFFICIAL_SOURCE_CATALOGUE.filter((s) => s.verificationStatus === 'verified');
    const candidates = OFFICIAL_SOURCE_CATALOGUE.filter(
      (s) => s.verificationStatus === 'needs_review'
    );
    expect(verified.length).toBeGreaterThan(0);
    expect(candidates.length).toBeGreaterThan(0);
  });
});

