import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { EmptyState, ToastProvider } from './components/ui';
import { MainLayout } from './layouts/MainLayout';
import { AdminSourcesPage } from './pages/AdminSourcesPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { HomePage } from './pages/HomePage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { RpoPage } from './pages/RpoPage';

const queryClient = new QueryClient();

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/rpo" element={<RpoPage />} />
        <Route
          path="/finance"
          element={
            <ModulePlaceholderPage
              title="Green Finance Directory"
              breadcrumbLabel="Green Finance"
              description="Curated directory of renewable-energy loans, grants, green bonds, and institutional incentives with verified eligibility and official links."
              plannedFeatures={[
                'Filter by borrower profile (citizen, MSME, developer) and financing instrument.',
                'Verified source attribution and non-advisory disclaimer on every listing.',
                'Clear marking of third-party terms and expired programs.',
              ]}
            />
          }
        />
        <Route
          path="/jobs"
          element={
            <ModulePlaceholderPage
              title="Green Jobs Portal"
              breadcrumbLabel="Green Jobs"
              description="Discover verified renewable-energy careers, skill pathways, employers, and training programs across India."
              plannedFeatures={[
                'Filter by role category, location, employment type, and required skills.',
                'Direct official employer or portal application links with verification timestamps.',
                'Automatic expiry handling for outdated postings.',
              ]}
            />
          }
        />
        <Route path="/admin" element={<AdminSourcesPage />} />
        <Route
          path="*"
          element={
            <EmptyState
              icon={<Compass className="w-5 h-5" aria-hidden="true" />}
              title="Route Not Found"
              description="The requested page does not exist in GreenGrid India."
              action={
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-[#16A36A] text-white hover:bg-[#138A59] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Return to National Dashboard
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

export default App;
