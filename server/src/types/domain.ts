export const VERIFICATION_STATUSES = [
  'unverified',
  'needs_review',
  'verified',
  'rejected',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SOURCE_TYPES = [
  'central_ministry',
  'regulator',
  'state_nodal_agency',
  'utility_discom',
  'public_open_data',
  'research_institute',
  'other',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const DATA_CATEGORIES = [
  'capacity_generation',
  'solar_wind',
  'policies_schemes',
  'rpo_regulations',
  'state_statistics',
  'green_finance',
  'tenders_opportunities',
  'general',
] as const;
export type DataCategory = (typeof DATA_CATEGORIES)[number];

export const EXPECTED_FORMATS = [
  'json',
  'csv',
  'xlsx',
  'pdf',
  'html',
  'rss',
  'mixed',
] as const;
export type ExpectedFormat = (typeof EXPECTED_FORMATS)[number];

export const ACCESS_METHODS = [
  'api',
  'csv',
  'xlsx',
  'rss',
  'html_public',
  'manual',
] as const;
export type AccessMethod = (typeof ACCESS_METHODS)[number];

export const GEOGRAPHIC_SCOPES = ['national', 'state', 'region'] as const;
export type GeographicScope = (typeof GEOGRAPHIC_SCOPES)[number];

export const POLICY_CATEGORIES = [
  'solar',
  'wind',
  'hybrid',
  'storage',
  'grid',
  'efficiency',
  'general',
] as const;
export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

export const POLICY_RECORD_KINDS = ['policy', 'scheme'] as const;
export type PolicyRecordKind = (typeof POLICY_RECORD_KINDS)[number];

export const RPO_CATEGORIES = [
  'solar',
  'non_solar',
  'wind',
  'hpo',
  'total',
  'other',
] as const;
export type RpoCategory = (typeof RPO_CATEGORIES)[number];

export const INGESTION_STATUSES = [
  'running',
  'completed',
  'partial',
  'failed',
  'dry_run',
] as const;
export type IngestionStatus = (typeof INGESTION_STATUSES)[number];

export const AUDIT_RECORD_TYPES = [
  'DataSource',
  'EnergyMetric',
  'PolicyScheme',
  'RpoRecord',
  'IngestionRun',
  'StagedRecord',
] as const;
export type AuditRecordType = (typeof AUDIT_RECORD_TYPES)[number];

export const REVIEW_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
  'needs_correction',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CHANGE_TYPES = ['new', 'unchanged', 'updated'] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

export const INGESTION_MODES = ['live', 'fixture'] as const;
export type IngestionMode = (typeof INGESTION_MODES)[number];

export const AUDIT_ACTIONS = [
  'staged',
  'dry_run',
  'approved',
  'rejected',
  'correction_requested',
  'published',
  'blocked',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const DATA_MODES = ['verified', 'demo', 'all'] as const;
export type DataMode = (typeof DATA_MODES)[number];

