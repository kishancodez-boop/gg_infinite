import { apiClient } from '../lib/apiClient';
import type {
  IngestionRunItem,
  PaginatedResponse,
  ReviewStatus,
  RunReaIngestRequest,
  RunReaIngestResult,
  StagedRecordItem,
} from '../types/rea';

export async function fetchIngestionRuns(params: {
  page?: number;
  limit?: number;
  dataMode?: 'verified' | 'demo' | 'all';
}): Promise<PaginatedResponse<IngestionRunItem>> {
  const { data } = await apiClient.get<PaginatedResponse<IngestionRunItem>>(
    '/api/v1/ingestion-runs',
    { params: { dataMode: 'all', ...params } }
  );
  return data;
}

export async function triggerReaIngest(
  payload: RunReaIngestRequest
): Promise<{ data: RunReaIngestResult }> {
  const { adminKey, ...body } = payload;
  const headers = adminKey?.trim() ? { 'x-admin-key': adminKey.trim() } : undefined;
  const { data } = await apiClient.post<{ data: RunReaIngestResult }>(
    '/api/v1/rea/ingest',
    body,
    { headers }
  );
  return data;
}

export async function fetchReviewQueue(params: {
  page?: number;
  limit?: number;
  reviewStatus?: ReviewStatus | '';
  dataMode?: 'verified' | 'demo' | 'all';
  adminKey?: string;
}): Promise<PaginatedResponse<StagedRecordItem>> {
  const cleanParams: Record<string, string | number> = {
    dataMode: params.dataMode ?? 'all',
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };
  if (params.reviewStatus) cleanParams.reviewStatus = params.reviewStatus;
  const headers = params.adminKey?.trim()
    ? { 'x-admin-key': params.adminKey.trim() }
    : undefined;

  const { data } = await apiClient.get<PaginatedResponse<StagedRecordItem>>(
    '/api/v1/rea/review-queue',
    { params: cleanParams, headers }
  );
  return data;
}

export async function submitReviewDecision(input: {
  id: string;
  decision: 'approve' | 'reject' | 'request_correction';
  reviewNotes?: string;
  reviewedBy?: string;
  publishOnApprove?: boolean;
  adminKey?: string;
}): Promise<{ data: { stagedRecord: StagedRecordItem } }> {
  const { id, adminKey, ...body } = input;
  const headers = adminKey?.trim() ? { 'x-admin-key': adminKey.trim() } : undefined;
  const { data } = await apiClient.post<{ data: { stagedRecord: StagedRecordItem } }>(
    `/api/v1/rea/review-queue/${id}/decision`,
    body,
    { headers }
  );
  return data;
}

export async function publishApprovedRecord(input: {
  id: string;
  adminKey?: string;
}): Promise<{ data: { stagedRecord: StagedRecordItem } }> {
  const headers = input.adminKey?.trim()
    ? { 'x-admin-key': input.adminKey.trim() }
    : undefined;
  const { data } = await apiClient.post<{ data: { stagedRecord: StagedRecordItem } }>(
    `/api/v1/rea/review-queue/${input.id}/publish`,
    {},
    { headers }
  );
  return data;
}

