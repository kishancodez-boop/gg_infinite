export type VerificationStatus =
  | 'unverified'
  | 'needs_review'
  | 'verified'
  | 'rejected';

export type DataCategory =
  | 'capacity_generation'
  | 'solar_wind'
  | 'policies_schemes'
  | 'rpo_regulations'
  | 'state_statistics'
  | 'green_finance'
  | 'tenders_opportunities'
  | 'general';

export interface DataSourceItem {
  _id: string;
  sourceName: string;
  organization: string;
  sourceUrl: string;
  domain: string;
  sourceType: string;
  dataCategory: DataCategory;
  description: string;
  accessMethod: string;
  expectedFormat: string;
  updateCadence: string;
  accessNotes: string;
  verificationStatus: VerificationStatus;
  evidenceNotes: string;
  lastCheckedAt: string | null;
  active: boolean;
  isDemoData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SourceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  dataCategory?: string;
  verificationStatus?: string;
  active?: string;
  sortBy?: 'createdAt' | 'lastCheckedAt' | 'sourceName' | 'organization' | 'dataCategory';
  sortOrder?: 'asc' | 'desc';
}

export interface SourceListResponse {
  success: true;
  data: DataSourceItem[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    dataMode: 'verified' | 'demo' | 'all';
    containsDemoData: boolean;
  };
}

