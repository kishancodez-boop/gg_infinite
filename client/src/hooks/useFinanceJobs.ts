import { useQuery } from '@tanstack/react-query';
import { fetchFinancePrograms, fetchJobListings } from '../services/financeJobsService';
import type { FinanceQueryParams, JobsQueryParams } from '../types/financeJobs';

export function useFinancePrograms(query: FinanceQueryParams) {
  return useQuery({
    queryKey: ['green-finance', query],
    queryFn: () => fetchFinancePrograms(query),
    retry: false,
  });
}

export function useJobListings(query: JobsQueryParams) {
  return useQuery({
    queryKey: ['green-jobs', query],
    queryFn: () => fetchJobListings(query),
    retry: false,
  });
}

