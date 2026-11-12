import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ToastProvider } from '../components/ui';
import * as dashboardService from '../services/dashboardService';

vi.mock('../services/systemService', () => ({
  fetchApiHealth: vi.fn().mockResolvedValue({
    service: 'GreenGrid India API',
    status: 'degraded',
    timestamp: '2026-11-12T10:30:00.000Z',
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
    timestamp: '2026-11-12T10:30:00.000Z',
    environment: 'test',
    database: {
      configured: false,
      connected: false,
      status: 'unconfigured',
      readyState: 0,
      lastError: null,
    },
    features: {
      milestone: '08-dashboard',
      modulesReady: true,
      reaIngestionReady: true,
      digitalTwinReady: false,
    },
  }),
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

describe('Milestone 08 — National Renewable Energy Dashboard Frontend', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders KPI cards, Not available fallback, DEMO labels, charts, state rankings, and source links', async () => {
    vi.spyOn(dashboardService, 'fetchNationalDashboard').mockResolvedValue({
      kpis: {
        totalRenewableCapacityMw: 29000,
        solarCapacityMw: 18500,
        windCapacityMw: 10500,
        otherRenewableCapacityMw: null,
        latestGeneration: {
          value: 1240,
          unit: 'MU',
          metricName: 'Renewable Generation (DEMO)',
          observationDate: '2026-01-31T00:00:00.000Z',
          stateOrRegion: 'India',
          isDemoData: true,
        },
      },
      energyMix: [
        { technology: 'Solar', capacityMw: 18500, sharePercent: 63.79 },
        { technology: 'Wind', capacityMw: 10500, sharePercent: 36.21 },
      ],
      stateRankings: [
        {
          rank: 1,
          stateOrRegion: 'Rajasthan',
          capacityMw: 18500,
          solarMw: 18500,
          windMw: null,
          otherMw: null,
          isDemoData: true,
        },
      ],
      trends: [
        {
          date: '2025-12-31',
          capacityMw: 29000,
          generationValue: 1240,
          generationUnit: 'MU',
        },
      ],
      recentUpdates: [
        {
          id: 'm1',
          metricName: 'Solar Installed Capacity (DEMO)',
          value: 18500,
          unit: 'MW',
          stateOrRegion: 'Rajasthan',
          observationDate: '2025-12-31',
          isDemoData: true,
          sourceName: 'MNRE (DEMO Fixture)',
          sourceUrl: 'https://mnre.gov.in',
          retrievedAt: '2026-01-15',
          verificationStatus: 'unverified',
        },
      ],
      meta: {
        recordCount: 2,
        hasDemoData: true,
        hasVerifiedData: false,
        lastUpdatedAt: '2026-01-15T00:00:00.000Z',
        availableStates: ['Rajasthan', 'India'],
      },
    });

    renderDashboard();

    expect(await screen.findByText('29,000 MW')).toBeTruthy();
    expect(screen.getByText('1,240 MU')).toBeTruthy();
    expect(screen.getAllByText('Not available').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/DEMO Data Notice:/i)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Renewable energy mix bar' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Capacity and generation trend chart' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /MNRE \(DEMO Fixture\)/i }).getAttribute('href')
    ).toBe('https://mnre.gov.in');
  });

  it('supports filters, empty state, and 503 database-unavailable error state', async () => {
    const fetchSpy = vi.spyOn(dashboardService, 'fetchNationalDashboard').mockResolvedValue({
      kpis: {
        totalRenewableCapacityMw: null,
        solarCapacityMw: null,
        windCapacityMw: null,
        otherRenewableCapacityMw: null,
        latestGeneration: null,
      },
      energyMix: [],
      stateRankings: [],
      trends: [],
      recentUpdates: [],
      meta: {
        recordCount: 0,
        hasDemoData: false,
        hasVerifiedData: false,
        lastUpdatedAt: null,
        availableStates: [],
      },
    });

    const { unmount } = renderDashboard();
    expect(await screen.findByText('No renewable energy metrics stored yet')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Technology'), { target: { value: 'solar' } });
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ technology: 'solar' }))
    );
    unmount();

    const err = new AxiosError('Service Unavailable');
    (err as { response?: unknown }).response = { status: 503 };
    vi.spyOn(dashboardService, 'fetchNationalDashboard').mockRejectedValue(err);

    renderDashboard();
    expect(
      await screen.findByText('MongoDB Not Connected (503 Service Unavailable)')
    ).toBeTruthy();
  });
});

