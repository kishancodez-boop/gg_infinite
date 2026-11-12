export type ReviewStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_correction';

export type ChangeType = 'new' | 'unchanged' | 'updated';
export type IngestionMode = 'live' | 'fixture';

export interface IngestionRunItem {
  _id: string;
  sourceRef:
    | string
    | {
        _id: string;
        sourceName?: string;
        organization?: string;
        domain?: string;
      };
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'completed' | 'partial' | 'failed' | 'dry_run';
  recordsProcessed: number;
  recordsAccepted: number;
  recordsRejected: number;
  recordsDuplicate?: number;
  recordsChanged?: number;
  isDryRun?: boolean;
  sourceMode?: IngestionMode;
  fixtureLabel?: string | null;
  validationErrors?: Array<{ rowIndex: number; field: string; message: string }>;
  errorSummary: string | null;
  isDemoData: boolean;
}

export interface StagedRecordItem {
  _id: string;
  sourceRef: {
    _id: string;
    sourceName: string;
    organization: string;
    domain: string;
    verificationStatus: string;
  };
  ingestionRunRef?: {
    _id: string;
    status: string;
    sourceMode?: IngestionMode;
    fixtureLabel?: string | null;
    startedAt: string;
  };
  naturalKey: string;
  contentHash: string;
  changeType: ChangeType;
  changeSummary: string;
  proposedData: {
    metricName: string;
    value: number;
    unit: string;
    geographicScope: string;
    stateOrRegion: string;
    observationDate: string;
  };
  provenance: {
    sourceUrl: string;
    retrievedAt: string;
    publishedAt: string | null;
    extractionMethod: string;
    verificationStatus: string;
    confidence: 'high' | 'medium' | 'low';
    notes: string;
  };
  reviewStatus: ReviewStatus;
  reviewNotes: string;
  reviewedBy: string;
  reviewedAt: string | null;
  publishedRecordId: string | null;
  publishedAt: string | null;
  isDemoData: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage?: boolean;
      hasPrevPage?: boolean;
    };
  };
}

export interface RunReaIngestRequest {
  sourceId: string;
  mode: IngestionMode;
  format: 'csv' | 'json';
  dryRun: boolean;
  adminKey?: string;
}

export interface RunReaIngestResult {
  dryRun: boolean;
  isDemoData: boolean;
  sourceMode: IngestionMode;
  fixtureLabel: string | null;
  ingestionRunId: string | null;
  status: string;
  source: {
    id: string;
    sourceName: string;
    domain: string;
    verificationStatus: string;
    accessMethod: string;
  };
  permission: {
    allowed: boolean;
    code: string;
    reason: string;
  };
  summary: {
    recordsProcessed: number;
    recordsAccepted: number;
    recordsRejected: number;
    recordsStaged: number;
    recordsDuplicate: number;
    recordsChanged: number;
  };
  validationErrors: Array<{ rowIndex: number; field: string; message: string }>;
  previews: Array<{
    stagedRecordId?: string;
    naturalKey: string;
    changeType: ChangeType;
    changeSummary: string;
    proposedData: StagedRecordItem['proposedData'];
    isDemoData: boolean;
  }>;
}

