import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env } from '../config/env.js';
import { RpoRecordModel } from '../models/index.js';
import { computeRpoSummary } from '../services/rpo/rpoAnalyticsService.js';

describe('Milestone 09 — RPO Compliance Calculation & API', () => {
  const app = createApp();
  const originalAdminKey = env.ADMIN_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = originalAdminKey;
  });

  it('calculates compliance %, energy gap, and keeps missing metrics as null (never 0)', () => {
    const summary = computeRpoSummary([
      {
        _id: 'r1',
        stateOrOrganization: 'JVVNL',
        entityType: 'discom',
        state: 'Rajasthan',
        discomName: 'JVVNL',
        compliancePeriod: 'FY 2024-25',
        category: 'solar',
        targetPercentage: 20,
        reportedPercentage: 18,
        targetEnergyMu: 1000,
        achievedEnergyMu: 900,
        verificationStatus: 'verified',
        isDemoData: false,
        lastVerifiedAt: '2026-01-15T00:00:00.000Z',
        sourceRef: {
          sourceName: 'RERC Order',
          sourceUrl: 'https://rerc.rajasthan.gov.in',
        },
      },
      {
        _id: 'r2',
        stateOrOrganization: 'Gujarat',
        entityType: 'state',
        compliancePeriod: 'FY 2024-25',
        category: 'wind',
        targetPercentage: 10,
        reportedPercentage: null,
        targetEnergyMu: null,
        achievedEnergyMu: null,
        verificationStatus: 'unverified',
        isDemoData: true,
        sourceRef: {
          sourceName: 'GEDA (DEMO)',
        },
      },
    ]);

    expect(summary.kpis.totalRecords).toBe(2);
    expect(summary.kpis.shortfallCount).toBe(1);
    expect(summary.kpis.unavailableCount).toBe(1);
    expect(summary.kpis.averageCompliancePercent).toBe(90);
    expect(summary.kpis.totalTargetEnergyMu).toBe(1000);
    expect(summary.kpis.totalAchievedEnergyMu).toBe(900);
    expect(summary.kpis.totalEnergyGapMu).toBe(100);
    expect(summary.records[0]!.complianceGapPercent).toBe(2);
    expect(summary.records[1]!.compliancePercent).toBeNull();
    expect(summary.records[1]!.complianceStatus).toBe('unavailable');
  });

  it('returns 503 DATABASE_UNAVAILABLE when MongoDB is disconnected', async () => {
    const res = await request(app).get('/api/v1/rpo/summary');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('validates RPO summary query params and returns summary when DB is connected', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const invalidRes = await request(app).get('/api/v1/rpo/summary?category=invalid_cat');
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');

    vi.spyOn(RpoRecordModel, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as never);

    const okRes = await request(app).get('/api/v1/rpo/summary?state=Rajasthan&category=solar');
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.kpis.totalRecords).toBe(0);
    expect(okRes.body.data.kpis.averageCompliancePercent).toBeNull();
  });

  it('protects POST /api/v1/rpo with fail-closed requireAdminAuth', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = undefined;

    const unconfiguredRes = await request(app).post('/api/v1/rpo').send({});
    expect(unconfiguredRes.status).toBe(403);
    expect(unconfiguredRes.body.error.code).toBe('ADMIN_AUTH_NOT_CONFIGURED');

    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = 'secret-rpo-key';
    const missingRes = await request(app).post('/api/v1/rpo').send({});
    expect(missingRes.status).toBe(401);
    expect(missingRes.body.error.code).toBe('UNAUTHORIZED');
  });
});

