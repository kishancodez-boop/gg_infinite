import { z } from 'zod';
import { DATA_MODES } from '../types/domain.js';

export const DASHBOARD_TECHNOLOGIES = ['all', 'solar', 'wind', 'other'] as const;

export const nationalDashboardQuerySchema = z
  .object({
    dataMode: z.enum(DATA_MODES).default('all'),
    stateOrRegion: z.string().trim().max(120).optional(),
    technology: z.enum(DASHBOARD_TECHNOLOGIES).default('all'),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => !data.fromDate || !data.toDate || data.toDate >= data.fromDate,
    {
      message: 'toDate cannot be earlier than fromDate',
      path: ['toDate'],
    }
  );

export type NationalDashboardQuery = z.infer<typeof nationalDashboardQuerySchema>;

