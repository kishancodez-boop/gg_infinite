import { useQuery } from '@tanstack/react-query';
import { fetchPolicies } from '../services/policyService';
import type { PolicyListQuery } from '../types/policy';

export function usePolicies(query: PolicyListQuery) {
  return useQuery({
    queryKey: ['policies-explorer', query],
    queryFn: () => fetchPolicies(query),
    retry: false,
  });
}

