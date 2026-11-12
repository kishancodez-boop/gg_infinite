export type PolicyRecordKind = 'policy' | 'scheme';
export type PolicyTechnology =
  | 'solar'
  | 'wind'
  | 'hybrid'
  | 'storage'
  | 'grid'
  | 'efficiency'
  | 'general';
export type SchemeCategory =
  | 'subsidy'
  | 'incentive'
  | 'regulatory_policy'
  | 'tariff_order'
  | 'mission'
  | 'other';
export type PolicyStatus = 'active' | 'inactive' | 'unknown';
export type VerificationStatus = 'unverified' | 'needs_review' | 'verified' | 'rejected';

export interface PolicySourceRef {
  _id: string;
  sourceName?: string;
  organization?: string;
  domain?: string;
  sourceUrl?: string;
  verificationStatus?: VerificationStatus;
}

export interface PolicySchemeItem {
  _id: string;
  title: string;
  description: string;
  issuingOrganization: string;
  recordKind: PolicyRecordKind;
  category: PolicyTechnology;
  technology?: PolicyTechnology;
  schemeCategory?: SchemeCategory;
  status?: PolicyStatus;
  jurisdiction: 'central' | 'state';
  stateOrRegion: string | null;
  officialUrl: string;
  effectiveDate: string | null;
  expiryDate?: string | null;
  eligibility?: string | null;
  lastVerifiedAt?: string | null;
  sourceRef: string | PolicySourceRef;
  verificationStatus: VerificationStatus;
  isDemoData: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyListQuery {
  page?: number;
  limit?: number;
  search?: string;
  recordKind?: PolicyRecordKind | 'all';
  technology?: PolicyTechnology | '';
  schemeCategory?: SchemeCategory | '';
  jurisdiction?: 'central' | 'state' | '';
  stateOrRegion?: string;
  issuingOrganization?: string;
  status?: PolicyStatus | '';
  dataMode?: 'verified' | 'demo' | 'all';
  sortBy?: 'effectiveDate' | 'lastVerifiedAt' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PolicyListResponse {
  data: PolicySchemeItem[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

