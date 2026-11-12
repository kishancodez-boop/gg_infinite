import { apiClient } from '../lib/apiClient';
import type { RpoSummaryQuery, RpoTrackerSummaryResponse } from '../types/rpo';

export async function fetchRpoSummary(
  query: RpoSummaryQuery
): Promise<RpoTrackerSummaryResponse> {
  const params: Record<string, string> = {
    dataMode: query.dataMode ?? 'all',
  };

  if (query.state?.trim()) params.state = query.state.trim();
  if (query.discomName?.trim()) params.discomName = query.discomName.trim();
  if (query.entityType) params.entityType = query.entityType;
  if (query.category) params.category = query.category;
  if (query.compliancePeriod?.trim()) params.compliancePeriod = query.compliancePeriod.trim();

  const { data } = await apiClient.get<{ data: RpoTrackerSummaryResponse }>(
    '/api/v1/rpo/summary',
    { params }
  );
  return data.data;
}

