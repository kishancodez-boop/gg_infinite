import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { EnergyMetricModel } from '../models/index.js';
import { computeNationalDashboardSummary } from '../services/dashboard/nationalDashboardService.js';

describe('Milestone 08 — National Dashboard Aggregation & API', () => {
  const app = createApp();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computes KPIs, energy mix, state rankings, trends, and treats missing metrics as null', () => {
    const summary = computeNationalDashboardSummary([
      {
        _id: 'm1',
        metricName: 'Solar Installed Capacity (DEMO)',
        value: 18.5,
        unit: 'GW',
        geographicScope: 'state',
        stateOrRegion: 'Rajasthan',
        observationDate: '2025-12-31T00:00:00.000Z',
        isDemoData: true,
        provenance: {
          originalSource: 'MNRE (DEMO Fixture)',
          sourceUrl: 'https://mnre.gov.in',
          retrievedAt: '2026-01-15T00:00:00.000Z',
          verificationStatus: 'unverified',
        },
      },
      {
        _id: 'm2',
        metricName: 'Wind Installed Capacity (DEMO)',
        value: 10500,
        unit: 'MW',
        geographicScope: 'state',
        stateOrRegion: 'Tamil Nadu',
        observationDate: '2025-12-31T00:00:00.000Z',
        isDemoData: true,
        provenance: {
          originalSource: 'MNRE (DEMO Fixture)',
          sourceUrl: 'https://mnre.gov.in',
          retrievedAt: '2026-01-15T00:00:00.000Z',
          verificationStatus: 'unverified',
        },
      },
      {
        _id: 'm3',
        metricName: 'Renewable Generation (DEMO)',
        value: 1240,
        unit: 'MU',
        geographicScope: 'national',
        stateOrRegion: 'India',
        observationDate: '2026-01-31T00:00:00.000Z',
        isDemoData: true,
        provenance: {
          originalSource: 'CEA (DEMO Fixture)',
          sourceUrl: 'https://cea.nic.in',
          retrievedAt: '2026-02-01T00:00:00.000Z',
          verificationStatus: 'unverified',
        },
      },
    ]);

    expect(summary.kpis.solarCapacityMw).toBe(18500);
    expect(summary.kpis.windCapacityMw).toBe(10500);
    // No other renewable capacity records -> must be null, NOT 0
    expect(summary.kpis.otherRenewableCapacityMw).toBeNull();
    expect(summary.kpis.totalRenewableCapacityMw).toBe(29000);
    expect(summary.kpis.latestGeneration?.value).toBe(1240);
    expect(summary.kpis.latestGeneration?.unit).toBe('MU');
    expect(summary.stateRankings[0]?.stateOrRegion).toBe('Rajasthan');
    expect(summary.stateRankings[1]?.stateOrRegion).toBe('Tamil Nadu');
    expect(summary.energyMix).toHaveLength(2);
    expect(summary.trends).toHaveLength(2);
    expect(summary.recentUpdates).toHaveLength(3);
    expect(summary.meta.hasDemoData).toBe(true);
  });

  it('returns 503 DATABASE_UNAVAILABLE when MongoDB is disconnected', async () => {
    const res = await request(app).get('/api/v1/dashboard/national');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('validates query parameters with Zod and returns dashboard payload when DB is connected', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const badDateRes = await request(app).get(
      '/api/v1/dashboard/national?fromDate=2026-02-01&toDate=2026-01-01'
    );
    expect(badDateRes.status).toBe(400);
    expect(badDateRes.body.error.code).toBe('VALIDATION_ERROR');

    vi.spyOn(EnergyMetricModel, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    const okRes = await request(app).get(
      '/api/v1/dashboard/national?technology=solar&dataMode=demo'
    );
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.meta.recordCount).toBe(0);
    expect(okRes.body.data.kpis.totalRenewableCapacityMw).toBeNull();
  });
});

