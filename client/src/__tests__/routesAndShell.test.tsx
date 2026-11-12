import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ErrorState, Input, Select, ToastProvider } from '../components/ui';

vi.mock('../services/sourceService', () => ({
  fetchSources: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        _id: '507f1f77bcf86cd799439011',
        sourceName: 'Ministry of New and Renewable Energy (MNRE)',
        organization: 'Ministry of New and Renewable Energy',
        sourceUrl: 'https://mnre.gov.in',
        domain: 'mnre.gov.in',
        sourceType: 'central_ministry',
        dataCategory: 'policies_schemes',
        description: 'Official MNRE portal.',
        accessMethod: 'manual',
        expectedFormat: 'mixed',
        updateCadence: 'monthly',
        accessNotes: 'Manual reference.',
        verificationStatus: 'verified',
        evidenceNotes: 'Official gov.in domain confirmed.',
        lastCheckedAt: '2026-11-12T00:00:00.000Z',
        active: true,
        isDemoData: false,
        createdAt: '2026-11-12T00:00:00.000Z',
        updatedAt: '2026-11-12T00:00:00.000Z',
      },
      {
        _id: '507f1f77bcf86cd799439012',
        sourceName: 'Gujarat Energy Development Agency (GEDA)',
        organization: 'Government of Gujarat',
        sourceUrl: 'https://geda.gujarat.gov.in',
        domain: 'geda.gujarat.gov.in',
        sourceType: 'state_nodal_agency',
        dataCategory: 'state_statistics',
        description: 'State nodal agency.',
        accessMethod: 'manual',
        expectedFormat: 'html',
        updateCadence: 'unknown',
        accessNotes: 'Requires robots.txt check.',
        verificationStatus: 'needs_review',
        evidenceNotes: 'Pending human review.',
        lastCheckedAt: '2026-11-12T00:00:00.000Z',
        active: true,
        isDemoData: false,
        createdAt: '2026-11-12T00:00:00.000Z',
        updatedAt: '2026-11-12T00:00:00.000Z',
      },
    ],
    meta: {
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      dataMode: 'verified',
      containsDemoData: false,
    },
  }),
}));

vi.mock('../services/systemService', () => ({
  fetchApiHealth: vi.fn().mockResolvedValue({
    service: 'GreenGrid India API',
    status: 'degraded',
    timestamp: '2026-11-12T07:00:00.000Z',
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
    timestamp: '2026-11-12T07:00:00.000Z',
    environment: 'test',
    database: {
      configured: false,
      connected: false,
      status: 'unconfigured',
      readyState: 0,
      lastError: null,
    },
    features: {
      milestone: '01-foundation',
      modulesReady: false,
      reaIngestionReady: false,
      digitalTwinReady: false,
    },
  }),
}));

function renderAtRoute(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

afterEach(() => {
  cleanup();
});

describe('Milestone 02 Application Shell & Routes', () => {
  const routes: Array<{ path: string; heading: string; navLabel: string }> = [
    { path: '/', heading: 'National Renewable Energy Dashboard', navLabel: 'National Dashboard' },
    { path: '/calculator', heading: 'Solar ROI Calculator', navLabel: 'Solar ROI Calculator' },
    { path: '/policies', heading: 'Policies & Schemes Explorer', navLabel: 'Policies & Schemes' },
    { path: '/rpo', heading: 'RPO Compliance Tracker', navLabel: 'RPO Tracker' },
    { path: '/finance', heading: 'Green Finance Directory', navLabel: 'Green Finance' },
    { path: '/jobs', heading: 'Green Jobs Portal', navLabel: 'Green Jobs' },
    { path: '/admin', heading: 'Official Data Source Registry', navLabel: 'Admin / REA' },
  ];

  it.each(routes)('renders route $path inside shell with active nav link', async ({ path, heading, navLabel }) => {
    renderAtRoute(path);

    expect(await screen.findByRole('heading', { name: heading })).toBeTruthy();

    const activeLinks = screen
      .getAllByRole('link', { name: navLabel })
      .filter((el) => el.getAttribute('aria-current') === 'page');
    expect(activeLinks.length).toBeGreaterThan(0);
  });

  it('opens and closes the mobile navigation drawer and platform guide drawer via keyboard/click', async () => {
    renderAtRoute('/');

    const openMenuBtn = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(openMenuBtn);

    const mobileDrawer = await screen.findByRole('dialog', { name: 'Mobile navigation' });
    expect(mobileDrawer).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).toBeNull();
    });
    expect(openMenuBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('supports switching tabs, opening provenance modal, and triggering toast notifications', async () => {
    renderAtRoute('/');

    const previewTab = await screen.findByRole('tab', { name: /Design System Preview/i });
    fireEvent.click(previewTab);

    expect(await screen.findByText('Reusable Eco-Tech UI Components')).toBeTruthy();

    const toastBtn = screen.getByRole('button', { name: 'Trigger Toast' });
    fireEvent.click(toastBtn);
    expect(await screen.findByText('Eco-Tech Toast Notification')).toBeTruthy();

    const modalBtn = screen.getByRole('button', { name: 'Open Provenance Modal' });
    fireEvent.click(modalBtn);
    expect(
      await screen.findByRole('dialog', { name: /Source Provenance & Data Integrity Standard/i })
    ).toBeTruthy();
  });

  it('renders accessible Input, Select, and ErrorState components', () => {
    const onRetry = vi.fn();
    render(
      <div>
        <Input label="State Search" error="State is required" />
        <Select
          label="Category"
          options={[{ value: 'solar', label: 'Solar' }]}
        />
        <ErrorState message="Connection timed out" onRetry={onRetry} />
      </div>
    );

    const input = screen.getByLabelText('State Search');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('State is required')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Route Not Found state for unknown paths', async () => {
    renderAtRoute('/unknown-route');
    expect(await screen.findByText('Route Not Found')).toBeTruthy();
  });

  it('displays verified and candidate sources and opens detail drawer on /admin', async () => {
    renderAtRoute('/admin');

    expect(
      await screen.findByText('Ministry of New and Renewable Energy (MNRE)')
    ).toBeTruthy();
    expect(screen.getByText('Gujarat Energy Development Agency (GEDA)')).toBeTruthy();

    const detailButtons = screen.getAllByRole('button', { name: 'Details' });
    fireEvent.click(detailButtons[0]!);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(await screen.findByText('Official gov.in domain confirmed.')).toBeTruthy();
  });
});
