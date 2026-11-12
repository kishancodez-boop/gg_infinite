import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ToastProvider } from '../components/ui';

vi.mock('../services/systemService', () => ({
  fetchApiHealth: vi.fn().mockResolvedValue({
    service: 'GreenGrid India API',
    status: 'degraded',
    timestamp: '2026-11-12T10:00:00.000Z',
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
    timestamp: '2026-11-12T10:00:00.000Z',
    environment: 'test',
    database: {
      configured: false,
      connected: false,
      status: 'unconfigured',
      readyState: 0,
      lastError: null,
    },
    features: {
      milestone: '07-calculator',
      modulesReady: true,
      reaIngestionReady: true,
      digitalTwinReady: false,
    },
  }),
}));

function renderCalculator() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/calculator']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

describe('Milestone 07 — Solar ROI Calculator Frontend', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders calculator inputs, results dashboard, scenarios, SVG charts, and disclaimers', async () => {
    renderCalculator();

    expect(
      await screen.findByRole('heading', { name: 'Solar ROI Calculator' })
    ).toBeTruthy();
    expect(screen.getByText('User-Assumption Simulator')).toBeTruthy();
    expect(screen.getAllByText('4.69 kW').length).toBeGreaterThanOrEqual(1);

    // 3 comparison scenarios
    expect(screen.getByText('Conservative')).toBeTruthy();
    expect(screen.getByText('Base Case')).toBeTruthy();
    expect(screen.getByText('Optimistic')).toBeTruthy();

    // Charts
    expect(screen.getByRole('img', { name: 'Annual net savings chart' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Cumulative cash-flow chart' })).toBeTruthy();

    // Disclaimers
    expect(screen.getByText(/not guaranteed financial returns/i)).toBeTruthy();
  });

  it('recalculates on input changes, validates invalid inputs, and handles zero consumption edge case', async () => {
    renderCalculator();

    const consumptionInput = await screen.findByLabelText('Monthly Consumption (kWh)');
    fireEvent.change(consumptionInput, { target: { value: '0' } });
    expect(screen.getAllByText('0 kW').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Monthly consumption is 0 kWh; recommended solar capacity is 0 kW/i)
    ).toBeTruthy();

    const pfInput = screen.getByLabelText('Performance Factor (0–1)');
    fireEvent.change(pfInput, { target: { value: '1.5' } });
    expect(screen.getByText('Performance factor must be between 0 and 1.')).toBeTruthy();

    // Reset button restores defaults
    fireEvent.click(screen.getByRole('button', { name: 'Reset Inputs' }));
    expect(screen.getAllByText('4.69 kW').length).toBeGreaterThanOrEqual(1);
  });
});

