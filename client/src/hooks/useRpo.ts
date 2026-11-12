import { useQuery } from '@tanstack/react-query';
import { fetchRpoSummary } from '../services/rpoService';
import type { RpoSummaryQuery } from '../types/rpo';

export function useRpoSummary(query: RpoSummaryQuery) {
  return useQuery({
    queryKey: ['rpo-summary', query],
    queryFn: () => fetchRpoSummary(query),
    retry: false,
  });
}

