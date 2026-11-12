import { z } from 'zod';
import {
  FINANCE_BORROWER_PROFILES,
  FINANCE_CATEGORIES,
  FINANCE_PROJECT_TYPES,
  JOB_EMPLOYMENT_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_ROLE_CATEGORIES,
  VERIFICATION_STATUSES,
} from '../types/domain.js';
import { baseListQuerySchema, httpUrlSchema, objectIdSchema } from './commonSchemas.js';

export const listFinanceQuerySchema = baseListQuerySchema.extend({
  financeCategory: z.enum(FINANCE_CATEGORIES).optional(),
  projectType: z.enum(FINANCE_PROJECT_TYPES).optional(),
  borrowerProfile: z.enum(FINANCE_BORROWER_PROFILES).optional(),
  institutionName: z.string().trim().max(200).optional(),
  sortBy: z
    .enum(['lastVerifiedAt', 'institutionName', 'programName', 'createdAt'])
    .default('lastVerifiedAt'),
});

export const createFinanceSchema = z.object({
  programName: z.string().trim().min(2).max(250),
  institutionName: z.string().trim().min(2).max(200),
  financeCategory: z.enum(FINANCE_CATEGORIES).default('concessional_loan'),
  supportedProjectTypes: z.array(z.enum(FINANCE_PROJECT_TYPES)).min(1).default(['all_renewables']),
  borrowerProfiles: z.array(z.enum(FINANCE_BORROWER_PROFILES)).min(1).default(['all']),
  description: z.string().trim().min(5).max(3000),
  officialSourceUrl: httpUrlSchema,
  termsNote: z.string().trim().max(1000).optional(),
  sourceRef: objectIdSchema.nullable().optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('unverified'),
  isDemoData: z.boolean().default(false),
  lastVerifiedAt: z.coerce.date().nullable().optional(),
});

export const listJobsQuerySchema = baseListQuerySchema.extend({
  roleCategory: z.enum(JOB_ROLE_CATEGORIES).optional(),
  location: z.string().trim().max(160).optional(),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS).optional(),
  employmentType: z.enum(JOB_EMPLOYMENT_TYPES).optional(),
  sortBy: z.enum(['lastVerifiedAt', 'title', 'organization', 'createdAt']).default('lastVerifiedAt'),
});

export const createJobSchema = z.object({
  title: z.string().trim().min(2).max(250),
  organization: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(160),
  stateOrRegion: z.string().trim().max(120).nullable().optional(),
  roleCategory: z.enum(JOB_ROLE_CATEGORIES).default('other'),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(25).default([]),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS).default('mid'),
  employmentType: z.enum(JOB_EMPLOYMENT_TYPES).default('full_time'),
  description: z.string().trim().min(5).max(3000),
  officialSourceUrl: httpUrlSchema,
  postingStatusNote: z.string().trim().max(1000).optional(),
  sourceRef: objectIdSchema.nullable().optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).default('unverified'),
  isDemoData: z.boolean().default(false),
  lastVerifiedAt: z.coerce.date().nullable().optional(),
});

