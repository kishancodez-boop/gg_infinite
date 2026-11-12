import { z } from 'zod';
import {
  ACCESS_METHODS,
  GEOGRAPHIC_SCOPES,
  INGESTION_STATUSES,
  POLICY_CATEGORIES,
  POLICY_RECORD_KINDS,
  RPO_CATEGORIES,
  SOURCE_TYPES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';
import {
  baseListQuerySchema,
  httpUrlSchema,
  objectIdSchema,
} from './commonSchemas.js';

export const listSourcesQuerySchema = baseListQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'lastCheckedAt', 'sourceName']).default('createdAt'),
  sourceType: z.enum(SOURCE_TYPES).optional(),
  accessMethod: z.enum(ACCESS_METHODS).optional(),
  active: z.enum(['true', 'false']).optional(),
});

export const createSourceSchema = z.object({
  sourceName: z.string().trim().min(2).max(200),
  organization: z.string().trim().min(2).max(200),
  sourceUrl: httpUrlSchema,
  sourceType: z.enum(SOURCE_TYPES),
  accessMethod: z.enum(ACCESS_METHODS),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('unverified'),
  lastCheckedAt: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
  isDemoData: z.boolean().default(false),
});

export const listMetricsQuerySchema = baseListQuerySchema.extend({
  sortBy: z.enum(['observationDate', 'createdAt', 'value']).default('observationDate'),
  geographicScope: z.enum(GEOGRAPHIC_SCOPES).optional(),
  stateOrRegion: z.string().trim().max(120).optional(),
  metricName: z.string().trim().max(200).optional(),
});

export const createMetricSchema = z.object({
  metricName: z.string().trim().min(2).max(200),
  value: z.number().finite(),
  unit: z.string().trim().min(1).max(50),
  geographicScope: z.enum(GEOGRAPHIC_SCOPES),
  stateOrRegion: z.string().trim().min(2).max(120),
  observationDate: z.coerce.date(),
  sourceRef: objectIdSchema,
  provenance: z.object({
    originalSource: z.string().trim().min(2).max(200),
    sourceUrl: httpUrlSchema,
    retrievedAt: z.coerce.date(),
    publishedAt: z.coerce.date().optional().nullable(),
    extractionMethod: z.enum(ACCESS_METHODS),
    confidence: z.number().min(0).max(1).default(0.5),
    verificationStatus: z.enum(VERIFICATION_STATUSES).default('unverified'),
  }),
  isDemoData: z.boolean().default(false),
});

export const listPoliciesQuerySchema = baseListQuerySchema.extend({
  sortBy: z.enum(['effectiveDate', 'createdAt', 'title']).default('createdAt'),
  category: z.enum(POLICY_CATEGORIES).optional(),
  jurisdiction: z.enum(['central', 'state']).optional(),
  recordKind: z.enum(POLICY_RECORD_KINDS).optional(),
});

export const createPolicySchema = z.object({
  title: z.string().trim().min(3).max(250),
  description: z.string().trim().min(10).max(4000),
  issuingOrganization: z.string().trim().min(2).max(200),
  recordKind: z.enum(POLICY_RECORD_KINDS).optional(),
  category: z.enum(POLICY_CATEGORIES),
  jurisdiction: z.enum(['central', 'state']).default('central'),
  stateOrRegion: z.string().trim().max(120).optional().nullable(),
  officialUrl: httpUrlSchema,
  effectiveDate: z.coerce.date().optional().nullable(),
  sourceRef: objectIdSchema,
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('unverified'),
  isDemoData: z.boolean().default(false),
});

export const listRpoQuerySchema = baseListQuerySchema.extend({
  sortBy: z.enum(['compliancePeriod', 'createdAt', 'targetPercentage']).default('createdAt'),
  stateOrOrganization: z.string().trim().max(200).optional(),
  compliancePeriod: z.string().trim().max(60).optional(),
  category: z.enum(RPO_CATEGORIES).optional(),
});

export const createRpoSchema = z.object({
  stateOrOrganization: z.string().trim().min(2).max(200),
  entityType: z.enum(['state', 'discom', 'utility', 'other']).default('state'),
  compliancePeriod: z.string().trim().min(2).max(60),
  category: z.enum(RPO_CATEGORIES).default('total'),
  targetPercentage: z.number().min(0).max(100),
  reportedPercentage: z.number().min(0).max(100).optional().nullable(),
  sourceRef: objectIdSchema,
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('unverified'),
  isDemoData: z.boolean().default(false),
});

export const listIngestionRunsQuerySchema = baseListQuerySchema.extend({
  sortBy: z.enum(['startedAt', 'createdAt', 'status']).default('startedAt'),
  status: z.enum(INGESTION_STATUSES).optional(),
  sourceRef: objectIdSchema.optional(),
});

export const createIngestionRunSchema = z
  .object({
    sourceRef: objectIdSchema,
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date().optional().nullable(),
    status: z.enum(INGESTION_STATUSES).default('dry_run'),
    recordsProcessed: z.number().int().min(0).default(0),
    recordsAccepted: z.number().int().min(0).default(0),
    recordsRejected: z.number().int().min(0).default(0),
    errorSummary: z.string().trim().max(2000).optional().nullable(),
    isDemoData: z.boolean().default(false),
  })
  .refine(
    (data) => data.recordsAccepted + data.recordsRejected <= data.recordsProcessed,
    {
      message: 'recordsAccepted + recordsRejected cannot exceed recordsProcessed',
      path: ['recordsAccepted'],
    }
  )
  .refine(
    (data) => !data.endedAt || data.endedAt >= data.startedAt,
    {
      message: 'endedAt cannot be earlier than startedAt',
      path: ['endedAt'],
    }
  );

