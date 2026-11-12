import { z } from 'zod';
import { DATA_MODES, VERIFICATION_STATUSES } from '../types/domain.js';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Must be a valid 24-character MongoDB ObjectId');

export const httpUrlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .refine((val) => /^https?:\/\//.test(val), 'URL must use http:// or https://');

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dataMode: z.enum(DATA_MODES).default('verified'),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
});

export type BaseListQuery = z.infer<typeof baseListQuerySchema>;

