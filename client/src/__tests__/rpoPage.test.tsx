import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ToastProvider } from '../components/ui';
import * as rpoService from '../services/rpoService';

vi.mock('../services/systemService', () => ({
  fetchApiHealth: vi.fn().mockResolvedValue({
    service: 'GreenGrid India API',
    status: 'degraded',
    timestamp: '2026-11-12T11:30:00.000Z',
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
    timestamp: '2026-11-12T11:30:00.000Z',
    environment: 'test',
    database: {
      configured: false,
      connected: false,
      status: 'unconfigured',
      readyState: 0,
      lastError: null,
    },
    features: {
      milestone: '09-rpo',
      modulesReady: true,
      reaIngestionReady: true,
      digitalTwinReady: false,
    },
  }),
}));

function renderRpoRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/rpo']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

describe('Milestone 09 — RPO Compliance Tracker Frontend', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders KPI cards, comparison chart, progress table, DEMO labels, and source links', async () => {
    vi.spyOn(rpoService, 'fetchRpoSummary').mockResolvedValue({
      kpis: {
        totalRecords: 2,
        compliantCount: 0,
        shortfallCount: 1,
        unavailableCount: 1,
        averageCompliancePercent: 90,
        totalTargetEnergyMu: 1000,
        totalAchievedEnergyMu: 900,
        totalEnergyGapMu: 100,
      },
      records: [
        {
          id: 'r1',
          stateOrOrganization: 'JVVNL',
          entityType: 'discom',
          state: 'Rajasthan',
          discomName: 'JVVNL',
          compliancePeriod: 'FY 2024-25',
          category: 'solar',
          targetPercentage: 20,
          reportedPercentage: 18,
          targetEnergyMu: 1000,
          achievedEnergyMu: 900,
          compliancePercent: 90,
          complianceGapPercent: 2,
          complianceGapMu: 100,
          complianceStatus: 'shortfall',
          verificationStatus: 'unverified',
          isDemoData: true,
          lastUpdatedAt: '2026-01-15T00:00:00.000Z',
          source: {
            sourceName: 'RERC (DEMO)',
            sourceUrl: 'https://rerc.rajasthan.gov.in',
          },
        },
      ],
      meta: {
        hasDemoData: true,
        hasVerifiedData: false,
        lastUpdatedAt: '2026-01-15T00:00:00.000Z',
      },
    });

    renderRpoRoute();

    expect(await screen.findByText('90%')).toBeTruthy();
    expect(screen.getAllByText('JVVNL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DEMO').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Shortfall').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('img', { name: 'RPO target vs reported achievement chart' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /RERC \(DEMO\)/i }).getAttribute('href')
    ).toBe('https://rerc.rajasthan.gov.in');
  });

  it('supports filters, empty state, and 503 database-unavailable error state', async () => {
    const fetchSpy = vi.spyOn(rpoService, 'fetchRpoSummary').mockResolvedValue({
      kpis: {
        totalRecords: 0,
        compliantCount: 0,
        shortfallCount: 0,
        unavailableCount: 0,
        averageCompliancePercent: null,
        totalTargetEnergyMu: null,
        totalAchievedEnergyMu: null,
        totalEnergyGapMu: null,
      },
      records: [],
      meta: {
        hasDemoData: false,
        hasVerifiedData: false,
        lastUpdatedAt: null,
      },
    });

    const { unmount } = renderRpoRoute();
    expect(await screen.findByText('No RPO compliance records found')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('RPO Category / Technology'), {
      target: { value: 'solar' },
    });
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ category: 'solar' }))
    );
    unmount();

    const err = new AxiosError('Service Unavailable');
    (err as { response?: unknown }).response = { status: 503 };
    vi.spyOn(rpoService, 'fetchRpoSummary').mockRejectedValue(err);

    renderRpoRoute();
    expect(
      await screen.findByText('MongoDB Not Connected (503 Service Unavailable)')
    ).toBeTruthy();
  });
});

