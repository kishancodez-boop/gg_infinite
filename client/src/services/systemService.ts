import { apiClient } from '../lib/apiClient';
import type { HealthResponse, SystemStatusResponse } from '../types/system';

export async function fetchApiHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/api/health');
  return data;
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  const { data } = await apiClient.get<SystemStatusResponse>('/api/v1/system/status');
  return data;
}

