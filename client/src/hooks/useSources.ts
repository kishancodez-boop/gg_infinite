import { useQuery } from '@tanstack/react-query';
import { fetchSources } from '../services/sourceService';
import type { SourceListQuery } from '../types/source';

export function useSources(query: SourceListQuery) {
  return useQuery({
    queryKey: ['sources', query],
    queryFn: () => fetchSources(query),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

