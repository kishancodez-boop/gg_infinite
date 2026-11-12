import { apiClient } from '../lib/apiClient';
import type { PolicyListQuery, PolicyListResponse, PolicySchemeItem } from '../types/policy';

export async function fetchPolicies(query: PolicyListQuery): Promise<PolicyListResponse> {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    dataMode: query.dataMode ?? 'all',
  };

  if (query.recordKind) params.recordKind = query.recordKind;
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.technology) params.technology = query.technology;
  if (query.schemeCategory) params.schemeCategory = query.schemeCategory;
  if (query.jurisdiction) params.jurisdiction = query.jurisdiction;
  if (query.stateOrRegion?.trim()) params.stateOrRegion = query.stateOrRegion.trim();
  if (query.issuingOrganization?.trim()) {
    params.issuingOrganization = query.issuingOrganization.trim();
  }
  if (query.status) params.status = query.status;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  const endpoint =
    query.recordKind === 'scheme' ? '/api/v1/schemes' : '/api/v1/policies';
  const { data } = await apiClient.get<PolicyListResponse>(endpoint, { params });
  return data;
}

export async function fetchPolicyDetail(
  id: string,
  kind: 'policy' | 'scheme' = 'policy'
): Promise<PolicySchemeItem> {
  const endpoint =
    kind === 'scheme' ? `/api/v1/schemes/${id}` : `/api/v1/policies/${id}`;
  const { data } = await apiClient.get<{ data: PolicySchemeItem }>(endpoint);
  return data.data;
}

