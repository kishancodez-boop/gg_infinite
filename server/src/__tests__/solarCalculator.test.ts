import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env } from '../config/env.js';
import {
  buildComparisonScenarios,
  calculateSolarRoi,
} from '../services/calculator/solarRoiEngine.js';

describe('Milestone 07 — Solar ROI Calculation Engine', () => {
  it('computes capacity recommendation, generation, savings, payback, degradation, escalation, and ROI accurately', () => {
    const result = calculateSolarRoi({
      monthlyConsumptionKwh: 450,
      electricityTariffInrPerKwh: 8,
      useRecommendedCapacity: true,
      installationCostPerKwInr: 50000,
      subsidyInr: 0,
      systemLifetimeYears: 25,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 0.8,
      annualDegradationPct: 0.5,
      annualTariffEscalationPct: 3,
      annualMaintenanceInr: 2000,
    });

    // dailyConsumption = 450 / 30 = 15 kWh; recommended = 15 / (4 * 0.8) = 4.69 kW
    expect(result.assumptions.dailyConsumptionKwh).toBe(15);
    expect(result.summary.recommendedCapacityKw).toBe(4.69);
    expect(result.summary.grossInstallationCostInr).toBe(234500);
    expect(result.summary.netInvestmentInr).toBe(234500);
    expect(result.cashFlows).toHaveLength(25);
    // Year 2 generation should degrade by 0.5% and tariff escalate by 3%
    expect(result.cashFlows[1]!.generationKwh).toBeLessThan(result.cashFlows[0]!.generationKwh);
    expect(result.cashFlows[1]!.effectiveTariffInr).toBeGreaterThan(
      result.cashFlows[0]!.effectiveTariffInr
    );
    expect(result.summary.simplePaybackYears).toBeGreaterThan(0);
    expect(result.summary.roiPercent).toBeGreaterThan(0);
  });

  it('handles zero consumption, zero investment, and subsidy > installation cost safely', () => {
    const zeroConsumption = calculateSolarRoi({
      monthlyConsumptionKwh: 0,
      electricityTariffInrPerKwh: 7,
      installationCostPerKwInr: 50000,
      systemLifetimeYears: 10,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 0.8,
    });
    expect(zeroConsumption.summary.recommendedCapacityKw).toBe(0);
    expect(zeroConsumption.summary.netInvestmentInr).toBe(0);
    expect(zeroConsumption.summary.roiPercent).toBeNull();
    expect(zeroConsumption.warnings.length).toBeGreaterThanOrEqual(2);

    const highSubsidy = calculateSolarRoi({
      monthlyConsumptionKwh: 300,
      electricityTariffInrPerKwh: 7,
      useRecommendedCapacity: false,
      capacityKw: 2,
      installationCostPerKwInr: 50000,
      subsidyInr: 150000, // > 100,000 gross cost
      systemLifetimeYears: 10,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 0.8,
    });
    expect(highSubsidy.summary.netInvestmentInr).toBe(0);
    expect(highSubsidy.summary.simplePaybackYears).toBe(0);
    expect(highSubsidy.summary.roiPercent).toBeNull();
    expect(highSubsidy.warnings.some((w) => w.includes('subsidy exceeds'))).toBe(true);
  });

  it('builds Conservative, Base Case, and Optimistic comparison scenarios', () => {
    const scenarios = buildComparisonScenarios({
      monthlyConsumptionKwh: 450,
      electricityTariffInrPerKwh: 7.5,
      installationCostPerKwInr: 55000,
      systemLifetimeYears: 25,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 0.8,
    });
    expect(scenarios.map((s) => s.id)).toEqual(['conservative', 'base', 'optimistic']);
    expect(scenarios[0]!.result.summary.lifetimeNetSavingsInr).toBeLessThan(
      scenarios[1]!.result.summary.lifetimeNetSavingsInr
    );
    expect(scenarios[2]!.result.summary.lifetimeNetSavingsInr).toBeGreaterThan(
      scenarios[1]!.result.summary.lifetimeNetSavingsInr
    );
  });
});

describe('Milestone 07 — Calculator HTTP Endpoints', () => {
  const app = createApp();
  const originalAdminKey = env.ADMIN_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = originalAdminKey;
  });

  it('POST /api/v1/calculator/simulate works without MongoDB and validates inputs with Zod', async () => {
    const validRes = await request(app).post('/api/v1/calculator/simulate').send({
      monthlyConsumptionKwh: 450,
      electricityTariffInrPerKwh: 7.5,
      installationCostPerKwInr: 55000,
      systemLifetimeYears: 25,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 0.8,
    });
    expect(validRes.status).toBe(200);
    expect(validRes.body.data.summary.recommendedCapacityKw).toBe(4.69);
    expect(validRes.body.data.scenarios).toHaveLength(3);

    const invalidRes = await request(app).post('/api/v1/calculator/simulate').send({
      monthlyConsumptionKwh: -100,
      electricityTariffInrPerKwh: 7.5,
      installationCostPerKwInr: 55000,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 1.5,
    });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('guards /api/v1/calculator/history with requireDatabase (503) and fail-closed requireAdminAuth (403)', async () => {
    const dbDownGet = await request(app).get('/api/v1/calculator/history');
    expect(dbDownGet.status).toBe(503);
    expect(dbDownGet.body.error.code).toBe('DATABASE_UNAVAILABLE');

    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = undefined;

    const noAuthPost = await request(app).post('/api/v1/calculator/history').send({
      monthlyConsumptionKwh: 450,
      electricityTariffInrPerKwh: 7.5,
      installationCostPerKwInr: 55000,
      dailyGenerationPerKwKwh: 4,
      performanceFactor: 0.8,
    });
    expect(noAuthPost.status).toBe(403);
    expect(noAuthPost.body.error.code).toBe('ADMIN_AUTH_NOT_CONFIGURED');
  });
});

