import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';

export const solarRoiSimulateSchema = z.object({
  label: z.string().trim().max(160).optional(),
  monthlyConsumptionKwh: z.number().finite().min(0).max(1_000_000),
  monthlyBillInr: z.number().finite().min(0).max(100_000_000).optional().nullable(),
  electricityTariffInrPerKwh: z.number().finite().min(0).max(100),
  useRecommendedCapacity: z.boolean().optional(),
  capacityKw: z.number().finite().min(0).max(10_000).optional().nullable(),
  installationCostPerKwInr: z.number().finite().min(0).max(1_000_000),
  initialInstallationCostInr: z.number().finite().min(0).max(1_000_000_000).optional().nullable(),
  subsidyInr: z.number().finite().min(0).max(1_000_000_000).default(0),
  systemLifetimeYears: z.number().int().min(1).max(40).default(25),
  dailyGenerationPerKwKwh: z.number().finite().min(0).max(12),
  performanceFactor: z.number().finite().min(0).max(1),
  annualDegradationPct: z.number().finite().min(0).max(10).default(0.5),
  annualTariffEscalationPct: z.number().finite().min(0).max(20).default(3),
  annualMaintenanceInr: z.number().finite().min(0).max(10_000_000).default(0),
  isDemoData: z.boolean().default(false),
});

export const listCalculatorHistoryQuerySchema = baseListQuerySchema.extend({
  dataMode: baseListQuerySchema.shape.dataMode.default('all'),
  sortBy: z.enum(['createdAt']).default('createdAt'),
});

