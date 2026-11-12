import { useQuery } from '@tanstack/react-query';
import { fetchNationalDashboard } from '../services/dashboardService';
import type { NationalDashboardQuery } from '../types/dashboard';

export function useNationalDashboard(query: NationalDashboardQuery) {
  return useQuery({
    queryKey: ['national-dashboard', query],
    queryFn: () => fetchNationalDashboard(query),
    retry: false,
  });
}

