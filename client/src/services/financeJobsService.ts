import { apiClient } from '../lib/apiClient';
import type {
  FinanceListResponse,
  FinanceQueryParams,
  GreenFinanceProgramItem,
  GreenJobListingItem,
  JobsListResponse,
  JobsQueryParams,
} from '../types/financeJobs';

export async function fetchFinancePrograms(
  query: FinanceQueryParams
): Promise<FinanceListResponse> {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    dataMode: query.dataMode ?? 'all',
  };

  if (query.search?.trim()) params.search = query.search.trim();
  if (query.financeCategory) params.financeCategory = query.financeCategory;
  if (query.projectType) params.projectType = query.projectType;
  if (query.borrowerProfile) params.borrowerProfile = query.borrowerProfile;

  const { data } = await apiClient.get<FinanceListResponse>('/api/v1/finance', { params });
  return data;
}

export async function fetchFinanceProgramById(id: string): Promise<GreenFinanceProgramItem> {
  const { data } = await apiClient.get<{ data: GreenFinanceProgramItem }>(`/api/v1/finance/${id}`);
  return data.data;
}

export async function fetchJobListings(query: JobsQueryParams): Promise<JobsListResponse> {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    dataMode: query.dataMode ?? 'all',
  };

  if (query.search?.trim()) params.search = query.search.trim();
  if (query.roleCategory) params.roleCategory = query.roleCategory;
  if (query.location?.trim()) params.location = query.location.trim();
  if (query.experienceLevel) params.experienceLevel = query.experienceLevel;
  if (query.employmentType) params.employmentType = query.employmentType;

  const { data } = await apiClient.get<JobsListResponse>('/api/v1/jobs', { params });
  return data;
}

export async function fetchJobListingById(id: string): Promise<GreenJobListingItem> {
  const { data } = await apiClient.get<{ data: GreenJobListingItem }>(`/api/v1/jobs/${id}`);
  return data.data;
}

