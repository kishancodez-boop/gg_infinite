import { useQuery } from '@tanstack/react-query';
import { fetchApiHealth, fetchSystemStatus } from '../services/systemService';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: fetchApiHealth,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system', 'status'],
    queryFn: fetchSystemStatus,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

