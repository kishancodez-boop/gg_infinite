import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { EmptyState, ToastProvider } from './components/ui';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';

const queryClient = new QueryClient();

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/calculator"
          element={
            <ModulePlaceholderPage
              title="Solar ROI Calculator"
              breadcrumbLabel="Solar ROI Calculator"
              description="Transparent rooftop solar system sizing, installation cost breakdown, subsidy assumptions, monthly savings, and simple payback estimation."
              plannedFeatures={[
                'User-editable assumptions (tariff, roof capacity, shading, degradation) with Zod validation.',
                'Clear separation between user inputs, platform estimates, and official subsidy rules.',
                'Honest uncertainty ranges — never guaranteeing fixed savings or subsidy approval.',
              ]}
            />
          }
        />
        <Route
          path="/policies"
          element={
            <ModulePlaceholderPage
              title="Policies & Schemes Explorer"
              breadcrumbLabel="Policies & Schemes"
              description="Searchable repository of central and state renewable-energy policies, subsidies, eligibility criteria, deadlines, and official documents."
              plannedFeatures={[
                'Filter by jurisdiction (Central / State), stakeholder group, and scheme status.',
                'Direct links to official government portals and last-verified timestamps.',
                'Stale-data indicators when verification dates exceed freshness thresholds.',
              ]}
            />
          }
        />
        <Route
          path="/rpo"
          element={
            <ModulePlaceholderPage
              title="RPO Compliance Tracker"
              breadcrumbLabel="RPO Tracker"
              description="Renewable Purchase Obligation targets, reported achievements, and entity/state comparisons backed by authoritative regulatory filings."
              plannedFeatures={[
                'Explicit distinction between official regulatory determinations and platform calculations.',
                'Obligation category breakdown (Solar, Wind, HPO, Other) and compliance period filters.',
                'Source document links and audit timestamps for every record.',
              ]}
            />
          }
        />
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
        <Route
          path="/admin"
          element={
            <ModulePlaceholderPage
              title="Admin / REA Console"
              breadcrumbLabel="Admin / REA"
              description="Controlled Reverse Engineering Agent (REA) ingestion console, source registry, dry-run inspection, and human review queue."
              plannedFeatures={[
                'Allowlisted official source registry with terms and robots.txt policy tracking.',
                'Dry-run ingestion pipeline (Fetch -> Parse -> Normalize -> Validate -> Deduplicate).',
                'Human review queue for low-confidence or changed records plus audit logs.',
              ]}
            />
          }
        />
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
