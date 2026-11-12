import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { ToastProvider } from '../components/ui';
import * as financeJobsService from '../services/financeJobsService';

function renderAtRoute(route: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Milestone 10 — Green Finance & Renewable Energy Jobs Frontend', () => {
  it('renders Green Finance Directory with verified/DEMO badges, official source link, and detail modal', async () => {
    vi.spyOn(financeJobsService, 'fetchFinancePrograms').mockResolvedValue({
      data: [
        {
          _id: 'fin-1',
          programName: 'IREDA Renewable Energy Term Loan',
          institutionName: 'IREDA',
          financeCategory: 'concessional_loan',
          supportedProjectTypes: ['utility_solar', 'wind'],
          borrowerProfiles: ['developer', 'msme'],
          description: 'Official institutional financing program for renewable power generation.',
          officialSourceUrl: 'https://www.ireda.in',
          verificationStatus: 'verified',
          isDemoData: false,
          lastVerifiedAt: '2026-02-10T00:00:00.000Z',
        },
        {
          _id: 'fin-2',
          programName: 'Sample MSME Rooftop Credit Line',
          institutionName: 'SIDBI (DEMO)',
          financeCategory: 'refinance_facility',
          supportedProjectTypes: ['rooftop_solar'],
          borrowerProfiles: ['msme'],
          description: 'Illustrative sample green finance entry.',
          officialSourceUrl: 'https://www.sidbi.in',
          verificationStatus: 'unverified',
          isDemoData: true,
          lastVerifiedAt: null,
        },
      ],
      meta: {
        dataMode: 'all',
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });

    renderAtRoute('/finance');

    expect(await screen.findByText('IREDA Renewable Energy Term Loan')).toBeTruthy();
    expect(screen.getByText('IREDA')).toBeTruthy();
    expect(screen.getByText('DEMO')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.getByText(/Non-Advisory Notice:/i)).toBeTruthy();

    const detailButtons = screen.getAllByRole('button', { name: 'View Details' });
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open Official Source/i }).getAttribute('href')).toBe(
      'https://www.ireda.in'
    );
  });

  it('renders Green Jobs Portal with filters, skills, DEMO badge, and 503 error state', async () => {
    const fetchSpy = vi.spyOn(financeJobsService, 'fetchJobListings').mockResolvedValue({
      data: [
        {
          _id: 'job-1',
          title: 'Grid Integration & BESS Engineer',
          organization: 'Solar Energy Corporation of India (DEMO)',
          location: 'New Delhi',
          roleCategory: 'grid_storage',
          requiredSkills: ['SCADA', 'BESS', 'PSS/E'],
          experienceLevel: 'mid',
          employmentType: 'full_time',
          description: 'Sample role profile for battery storage and grid integration.',
          officialSourceUrl: 'https://www.seci.co.in',
          verificationStatus: 'unverified',
          isDemoData: true,
          lastVerifiedAt: null,
        },
      ],
      meta: {
        dataMode: 'all',
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });

    const { unmount } = renderAtRoute('/jobs');

    expect(await screen.findByText('Grid Integration & BESS Engineer')).toBeTruthy();
    expect(screen.getByText('SCADA')).toBeTruthy();
    expect(screen.getByText('DEMO')).toBeTruthy();
    expect(screen.getByText(/Vacancy Integrity Notice:/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Experience Level'), {
      target: { value: 'senior' },
    });
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ experienceLevel: 'senior' }))
    );
    unmount();

    const err503 = new AxiosError('Service Unavailable', undefined, undefined, undefined, {
      status: 503,
      data: { error: { code: 'DATABASE_UNAVAILABLE' } },
      statusText: 'Service Unavailable',
      headers: {},
      config: {} as never,
    } as AxiosResponse);
    vi.spyOn(financeJobsService, 'fetchJobListings').mockRejectedValue(err503);

    renderAtRoute('/jobs');
    expect(await screen.findByText('Database Unavailable (503)')).toBeTruthy();
  });
});
