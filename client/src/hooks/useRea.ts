import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchIngestionRuns,
  fetchReviewQueue,
  publishApprovedRecord,
  submitReviewDecision,
  triggerReaIngest,
} from '../services/reaService';
import type { ReviewStatus } from '../types/rea';

export function useIngestionRuns(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: ['ingestion-runs', params],
    queryFn: () => fetchIngestionRuns({ ...params, dataMode: 'all' }),
    retry: false,
  });
}

export function useReviewQueue(params: {
  page: number;
  limit: number;
  reviewStatus: ReviewStatus | '';
  adminKey?: string;
}) {
  return useQuery({
    queryKey: ['rea-review-queue', params],
    queryFn: () => fetchReviewQueue({ ...params, dataMode: 'all' }),
    retry: false,
  });
}

export function useReaMutations() {
  const queryClient = useQueryClient();

  const invalidateRea = () => {
    void queryClient.invalidateQueries({ queryKey: ['ingestion-runs'] });
    void queryClient.invalidateQueries({ queryKey: ['rea-review-queue'] });
  };

  const ingestMutation = useMutation({
    mutationFn: triggerReaIngest,
    onSuccess: invalidateRea,
  });

  const decisionMutation = useMutation({
    mutationFn: submitReviewDecision,
    onSuccess: invalidateRea,
  });

  const publishMutation = useMutation({
    mutationFn: publishApprovedRecord,
    onSuccess: invalidateRea,
  });

  return { ingestMutation, decisionMutation, publishMutation };
}

