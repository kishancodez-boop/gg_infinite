import { apiClient } from '../lib/apiClient';
import type { SourceListQuery, SourceListResponse } from '../types/source';

export async function fetchSources(query: SourceListQuery): Promise<SourceListResponse> {
  const params: Record<string, string | number> = {};
  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.dataCategory) params.dataCategory = query.dataCategory;
  if (query.verificationStatus) params.verificationStatus = query.verificationStatus;
  if (query.active) params.active = query.active;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  const { data } = await apiClient.get<SourceListResponse>('/api/v1/sources', { params });
  return data;
}

