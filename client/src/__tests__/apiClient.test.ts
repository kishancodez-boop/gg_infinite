import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from '../lib/apiClient';

describe('apiClient configuration', () => {
  it('returns empty string when VITE_API_BASE_URL is omitted so Vite proxy is used', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('');
    expect(resolveApiBaseUrl('   ')).toBe('');
  });

  it('strips trailing slashes from an explicit API base URL', () => {
    expect(resolveApiBaseUrl('http://localhost:5000///')).toBe('http://localhost:5000');
  });
});

