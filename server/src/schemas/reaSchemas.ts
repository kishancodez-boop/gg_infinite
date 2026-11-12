import { z } from 'zod';
import {
  AUDIT_RECORD_TYPES,
  CHANGE_TYPES,
  INGESTION_MODES,
  REVIEW_STATUSES,
} from '../types/domain.js';
import { baseListQuerySchema, objectIdSchema } from './commonSchemas.js';

export const runReaIngestSchema = z.object({
  sourceId: objectIdSchema,
  mode: z.enum(INGESTION_MODES).default('fixture'),
  format: z.enum(['csv', 'json']).default('csv'),
  dryRun: z.boolean().default(true),
  targetUrl: z.string().trim().url().optional(),
  actor: z.string().trim().max(120).optional(),
});

export const listReviewQueueQuerySchema = baseListQuerySchema.extend({
  dataMode: baseListQuerySchema.shape.dataMode.default('all'),
  reviewStatus: z.enum(REVIEW_STATUSES).optional(),
  changeType: z.enum(CHANGE_TYPES).optional(),
  sourceRef: objectIdSchema.optional(),
  sortBy: z.enum(['createdAt', 'reviewStatus', 'changeType']).default('createdAt'),
});

export const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_correction']),
  reviewNotes: z.string().trim().max(600).optional(),
  reviewedBy: z.string().trim().max(120).optional(),
  publishOnApprove: z.boolean().default(false),
});

export const listAuditLogsQuerySchema = baseListQuerySchema.extend({
  dataMode: baseListQuerySchema.shape.dataMode.default('all'),
  recordType: z.enum(AUDIT_RECORD_TYPES).optional(),
  sortBy: z.enum(['createdAt', 'retrievedAt']).default('createdAt'),
});

