export type DataModeFilter = 'all' | 'verified' | 'demo';

export type FinanceCategory =
  | 'concessional_loan'
  | 'green_bond'
  | 'grant_viability_gap'
  | 'refinance_facility'
  | 'equity_fund'
  | 'risk_guarantee'
  | 'other';

export type FinanceProjectType =
  | 'utility_solar'
  | 'rooftop_solar'
  | 'wind'
  | 'hybrid_storage'
  | 'green_hydrogen'
  | 'msme_decentralized'
  | 'grid_infrastructure'
  | 'all_renewables';

export type FinanceBorrowerProfile =
  | 'developer'
  | 'msme'
  | 'residential'
  | 'utility_discom'
  | 'state_agency'
  | 'all';

export type JobExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead_principal' | 'all';

export type JobEmploymentType =
  | 'full_time'
  | 'contract'
  | 'fellowship'
  | 'internship'
  | 'apprenticeship';

export type JobRoleCategory =
  | 'solar_engineering'
  | 'wind_engineering'
  | 'grid_storage'
  | 'policy_regulatory'
  | 'green_finance'
  | 'operations_maintenance'
  | 'other';

export interface PopulatedSourceRef {
  _id: string;
  sourceName: string;
  organization: string;
  domain: string;
  sourceUrl: string;
  verificationStatus: string;
}

export interface GreenFinanceProgramItem {
  _id: string;
  programName: string;
  institutionName: string;
  financeCategory: FinanceCategory;
  supportedProjectTypes: FinanceProjectType[];
  borrowerProfiles: FinanceBorrowerProfile[];
  description: string;
  officialSourceUrl: string;
  termsNote?: string;
  sourceRef?: PopulatedSourceRef | null;
  verificationStatus: 'unverified' | 'needs_review' | 'verified' | 'rejected';
  isDemoData: boolean;
  lastVerifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GreenJobListingItem {
  _id: string;
  title: string;
  organization: string;
  location: string;
  stateOrRegion?: string | null;
  roleCategory: JobRoleCategory;
  requiredSkills: string[];
  experienceLevel: JobExperienceLevel;
  employmentType: JobEmploymentType;
  description: string;
  officialSourceUrl: string;
  postingStatusNote?: string;
  sourceRef?: PopulatedSourceRef | null;
  verificationStatus: 'unverified' | 'needs_review' | 'verified' | 'rejected';
  isDemoData: boolean;
  lastVerifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListMeta {
  dataMode: DataModeFilter;
  pagination: PaginationMeta;
  hasDemoData?: boolean;
  hasVerifiedData?: boolean;
}

export interface FinanceListResponse {
  data: GreenFinanceProgramItem[];
  meta: ListMeta;
}

export interface JobsListResponse {
  data: GreenJobListingItem[];
  meta: ListMeta;
}

export interface FinanceQueryParams {
  page?: number;
  limit?: number;
  dataMode?: DataModeFilter;
  search?: string;
  financeCategory?: FinanceCategory | '';
  projectType?: FinanceProjectType | '';
  borrowerProfile?: FinanceBorrowerProfile | '';
}

export interface JobsQueryParams {
  page?: number;
  limit?: number;
  dataMode?: DataModeFilter;
  search?: string;
  roleCategory?: JobRoleCategory | '';
  location?: string;
  experienceLevel?: JobExperienceLevel | '';
  employmentType?: JobEmploymentType | '';
}
