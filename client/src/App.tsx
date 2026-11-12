import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/policies"
              element={
                <ModulePlaceholderPage
                  title="Policies & Schemes Explorer"
                  description="Central and state renewable energy schemes with official links and verification dates will be implemented in a later milestone."
                />
              }
            />
            <Route
              path="/calculator"
              element={
                <ModulePlaceholderPage
                  title="Solar ROI Calculator"
                  description="Transparent solar capacity, savings, and simple payback estimation tools will be implemented in a later milestone."
                />
              }
            />
            <Route
              path="/rpo"
              element={
                <ModulePlaceholderPage
                  title="RPO Compliance Tracker"
                  description="Renewable Purchase Obligation tracking backed by verified regulatory data will be implemented in a later milestone."
                />
              }
            />
            <Route
              path="/finance"
              element={
                <ModulePlaceholderPage
                  title="Green Finance Directory"
                  description="Source-attributed green loans, grants, and incentives will be implemented in a later milestone."
                />
              }
            />
            <Route
              path="/jobs"
              element={
                <ModulePlaceholderPage
                  title="Green Jobs Portal"
                  description="Verified renewable-energy career listings and training pathways will be implemented in a later milestone."
                />
              }
            />
            <Route
              path="/admin"
              element={
                <ModulePlaceholderPage
                  title="REA Ingestion & Admin Console"
                  description="Source registry, controlled REA ingestion dry-runs, and human review workflows will be implemented in later milestones."
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

