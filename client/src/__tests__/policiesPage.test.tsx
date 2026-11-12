import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ToastProvider } from '../components/ui';
import * as policyService from '../services/policyService';

vi.mock('../services/systemService', () => ({
  fetchApiHealth: vi.fn().mockResolvedValue({
    service: 'GreenGrid India API',
    status: 'degraded',
    timestamp: '2026-11-12T09:00:00.000Z',
    environment: 'test',
    uptimeSeconds: 10,
    database: {
      configured: false,
      connected: false,
      status: 'unconfigured',
      readyState: 0,
      lastError: null,
    },
  }),
  fetchSystemStatus: vi.fn().mockResolvedValue({
    service: 'GreenGrid India API',
    version: '0.1.0',
    apiStatus: 'operational',
    timestamp: '2026-11-12T09:00:00.000Z',
    environment: 'test',
    database: {
      configured: false,
      connected: false,
      status: 'unconfigured',
      readyState: 0,
      lastError: null,
    },
    features: {
      milestone: '06-policies',
      modulesReady: true,
      reaIngestionReady: true,
      digitalTwinReady: false,
    },
  }),
}));

const MOCK_ITEMS = [
  {
    _id: 'pol-1',
    title: 'National Solar Mission Policy',
    description: 'Central policy framework for solar deployment.',
    issuingOrganization: 'MNRE',
    recordKind: 'policy' as const,
    category: 'solar' as const,
    technology: 'solar' as const,
    schemeCategory: 'mission' as const,
    status: 'active' as const,
    jurisdiction: 'central' as const,
    stateOrRegion: null,
    officialUrl: 'https://mnre.gov.in/solar-mission',
    effectiveDate: '2024-01-15T00:00:00.000Z',
    expiryDate: null,
    eligibility: null,
    lastVerifiedAt: '2026-01-10T00:00:00.000Z',
    sourceRef: {
      _id: 'src-1',
      sourceName: 'MNRE Official Portal',
      domain: 'mnre.gov.in',
    },
    verificationStatus: 'verified' as const,
    isDemoData: false,
  },
  {
    _id: 'sch-1',
    title: 'Rooftop Solar Sample Scheme (DEMO)',
    description: 'Demo fixture scheme for UI testing.',
    issuingOrganization: 'GEDA',
    recordKind: 'scheme' as const,
    category: 'solar' as const,
    technology: 'solar' as const,
    schemeCategory: 'subsidy' as const,
    status: 'unknown' as const,
    jurisdiction: 'state' as const,
    stateOrRegion: 'Gujarat',
    officialUrl: 'https://geda.gujarat.gov.in/sample',
    effectiveDate: null,
    expiryDate: null,
    eligibility: null,
    lastVerifiedAt: null,
    sourceRef: 'src-2',
    verificationStatus: 'unverified' as const,
    isDemoData: true,
  },
];

function renderPoliciesRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/policies']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

describe('Milestone 06 — Policies & Schemes Explorer Frontend', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders explorer, summary counts, DEMO badge, official source links, and detail drawer', async () => {
    const fetchSpy = vi.spyOn(policyService, 'fetchPolicies').mockResolvedValue({
      data: MOCK_ITEMS,
      meta: {
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });

    renderPoliciesRoute();

    expect(await screen.findByText('National Solar Mission Policy')).toBeTruthy();
    expect(screen.getByText('Rooftop Solar Sample Scheme (DEMO)')).toBeTruthy();
    expect(screen.getByText('2 Matching')).toBeTruthy();
    expect(screen.getByText('DEMO')).toBeTruthy();

    const sourceLinks = screen.getAllByRole('link', { name: /Source/i });
    expect(sourceLinks[0]?.getAttribute('href')).toBe('https://mnre.gov.in/solar-mission');

    const detailButtons = screen.getAllByRole('button', { name: 'Details' });
    fireEvent.click(detailButtons[1]!);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/DEMO Sample Record:/i)).toBeTruthy();
    expect(screen.getAllByText('Not available').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole('link', { name: /Open Official Source URL/i }).getAttribute('href')
    ).toBe('https://geda.gujarat.gov.in/sample');

    // Switch tabs
    fireEvent.click(screen.getByRole('tab', { name: 'Schemes' }));
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ recordKind: 'scheme' }))
    );
  });

  it('supports search with clear button and filter changes', async () => {
    const fetchSpy = vi.spyOn(policyService, 'fetchPolicies').mockResolvedValue({
      data: [],
      meta: {
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });

    renderPoliciesRoute();

    const searchInput = await screen.findByLabelText('Search Titles & Descriptions');
    fireEvent.change(searchInput, { target: { value: 'KUSUM' } });

    await waitFor(
      () => expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ search: 'KUSUM' })),
      { timeout: 1500 }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear Search' }));
    expect((searchInput as HTMLInputElement).value).toBe('');

    fireEvent.change(screen.getByLabelText('Scope'), { target: { value: 'state' } });
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ jurisdiction: 'state' }))
    );

    expect(await screen.findByText('No matching policies or schemes found')).toBeTruthy();
  });

  it('renders loading state and 503 database-unavailable error state honestly', async () => {
    vi.spyOn(policyService, 'fetchPolicies').mockImplementation(
      () => new Promise(() => {}) // keep pending to check loading skeleton
    );

    const { unmount } = renderPoliciesRoute();
    expect(await screen.findByRole('heading', { name: 'Policies & Schemes Explorer' })).toBeTruthy();
    unmount();

    const err = new AxiosError('Service Unavailable');
    (err as { response?: unknown }).response = { status: 503 };
    vi.spyOn(policyService, 'fetchPolicies').mockRejectedValue(err);

    renderPoliciesRoute();
    expect(
      await screen.findByText('MongoDB Not Connected (503 Service Unavailable)')
    ).toBeTruthy();
  });
});

