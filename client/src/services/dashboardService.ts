import { apiClient } from '../lib/apiClient';
import type {
  NationalDashboardQuery,
  NationalDashboardSummary,
} from '../types/dashboard';

export async function fetchNationalDashboard(
  query: NationalDashboardQuery
): Promise<NationalDashboardSummary> {
  const params: Record<string, string> = {
    dataMode: query.dataMode ?? 'all',
    technology: query.technology ?? 'all',
  };

  if (query.stateOrRegion?.trim()) params.stateOrRegion = query.stateOrRegion.trim();
  if (query.fromDate) params.fromDate = query.fromDate;
  if (query.toDate) params.toDate = query.toDate;

  const { data } = await apiClient.get<{ data: NationalDashboardSummary }>(
    '/api/v1/dashboard/national',
    { params }
  );
  return data.data;
}

