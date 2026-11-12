import axios from 'axios';

export function resolveApiBaseUrl(rawBaseUrl?: string): string {
  const trimmed = rawBaseUrl?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : '';
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

