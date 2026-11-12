import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env } from '../config/env.js';
import { GreenFinanceProgramModel, GreenJobListingModel } from '../models/index.js';

function makeChainableQuery(result: unknown) {
  return {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
}

describe('Milestone 10 — Green Finance & Renewable Energy Jobs API', () => {
  const app = createApp();
  const originalAdminKey = env.ADMIN_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = originalAdminKey;
  });

  it('returns 503 DATABASE_UNAVAILABLE for /api/v1/finance and /api/v1/jobs when disconnected', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(false);

    const financeRes = await request(app).get('/api/v1/finance');
    expect(financeRes.status).toBe(503);
    expect(financeRes.body.error.code).toBe('DATABASE_UNAVAILABLE');

    const jobsRes = await request(app).get('/api/v1/jobs');
    expect(jobsRes.status).toBe(503);
    expect(jobsRes.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('lists and filters Green Finance programs with verified/demo separation', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const samplePrograms = [
      {
        _id: '507f1f77bcf86cd799439011',
        programName: 'IREDA Solar Project Term Loan',
        institutionName: 'IREDA',
        financeCategory: 'concessional_loan',
        supportedProjectTypes: ['utility_solar', 'rooftop_solar'],
        borrowerProfiles: ['developer', 'msme'],
        description: 'Institutional project finance for grid-connected solar.',
        officialSourceUrl: 'https://www.ireda.in',
        verificationStatus: 'verified',
        isDemoData: false,
        lastVerifiedAt: '2026-02-01T00:00:00.000Z',
      },
    ];

    const findSpy = vi
      .spyOn(GreenFinanceProgramModel, 'find')
      .mockReturnValue(makeChainableQuery(samplePrograms) as never);
    vi.spyOn(GreenFinanceProgramModel, 'countDocuments').mockResolvedValue(1 as never);

    const res = await request(app).get(
      '/api/v1/finance?financeCategory=concessional_loan&projectType=utility_solar&search=IREDA'
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].institutionName).toBe('IREDA');
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isDemoData: false,
        financeCategory: 'concessional_loan',
        supportedProjectTypes: 'utility_solar',
      })
    );
  });

  it('lists and filters Green Job listings by roleCategory, location, and experienceLevel', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const sampleJobs = [
      {
        _id: '507f1f77bcf86cd799439022',
        title: 'Solar PV Design Engineer (Sample)',
        organization: 'National Institute of Solar Energy (DEMO)',
        location: 'Gurugram, Haryana',
        roleCategory: 'solar_engineering',
        requiredSkills: ['PVsyst', 'AutoCAD', 'Grid Interconnection'],
        experienceLevel: 'mid',
        employmentType: 'full_time',
        description: 'Sample role profile for solar PV engineering.',
        officialSourceUrl: 'https://nise.res.in',
        verificationStatus: 'unverified',
        isDemoData: true,
        lastVerifiedAt: null,
      },
    ];

    const findSpy = vi
      .spyOn(GreenJobListingModel, 'find')
      .mockReturnValue(makeChainableQuery(sampleJobs) as never);
    vi.spyOn(GreenJobListingModel, 'countDocuments').mockResolvedValue(1 as never);

    const res = await request(app).get(
      '/api/v1/jobs?dataMode=demo&roleCategory=solar_engineering&experienceLevel=mid&location=Gurugram'
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].isDemoData).toBe(true);
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isDemoData: true,
        roleCategory: 'solar_engineering',
        experienceLevel: 'mid',
      })
    );
  });

  it('returns 400 VALIDATION_ERROR for invalid finance or job query params', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);

    const badFinance = await request(app).get('/api/v1/finance?financeCategory=invalid_cat');
    expect(badFinance.status).toBe(400);
    expect(badFinance.body.error.code).toBe('VALIDATION_ERROR');

    const badJob = await request(app).get('/api/v1/jobs?experienceLevel=guru');
    expect(badJob.status).toBe(400);
    expect(badJob.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('protects POST /api/v1/finance and POST /api/v1/jobs with requireAdminAuth', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = 'secret-admin-key';

    const unauthFinance = await request(app).post('/api/v1/finance').send({});
    expect([401, 403]).toContain(unauthFinance.status);

    const unauthJob = await request(app).post('/api/v1/jobs').send({});
    expect([401, 403]).toContain(unauthJob.status);
  });
});

