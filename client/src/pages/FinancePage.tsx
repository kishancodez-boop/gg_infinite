import axios from 'axios';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Select,
  SkeletonCard,
} from '../components/ui';
import { useFinancePrograms } from '../hooks/useFinanceJobs';
import type {
  DataModeFilter,
  FinanceBorrowerProfile,
  FinanceCategory,
  FinanceProjectType,
  GreenFinanceProgramItem,
} from '../types/financeJobs';

const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  concessional_loan: 'Concessional Loan',
  green_bond: 'Green Bond',
  grant_viability_gap: 'Grant / VGF',
  refinance_facility: 'Refinance Facility',
  equity_fund: 'Equity Fund',
  risk_guarantee: 'Risk Guarantee',
  other: 'Other Finance',
};

const PROJECT_TYPE_LABELS: Record<FinanceProjectType, string> = {
  utility_solar: 'Utility Solar',
  rooftop_solar: 'Rooftop Solar',
  wind: 'Wind',
  hybrid_storage: 'Hybrid & Storage',
  green_hydrogen: 'Green Hydrogen',
  msme_decentralized: 'MSME & Decentralized',
  grid_infrastructure: 'Grid Infrastructure',
  all_renewables: 'All Renewables',
};

const BORROWER_LABELS: Record<FinanceBorrowerProfile, string> = {
  developer: 'Project Developer',
  msme: 'MSME',
  residential: 'Residential',
  utility_discom: 'Utility / DISCOM',
  state_agency: 'State Agency',
  all: 'All Borrowers',
};

function formatDateLabel(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FinancePage() {
  const [search, setSearch] = useState('');
  const [financeCategory, setFinanceCategory] = useState<FinanceCategory | ''>('');
  const [projectType, setProjectType] = useState<FinanceProjectType | ''>('');
  const [borrowerProfile, setBorrowerProfile] = useState<FinanceBorrowerProfile | ''>('');
  const [dataMode, setDataMode] = useState<DataModeFilter>('all');
  const [selectedProgram, setSelectedProgram] = useState<GreenFinanceProgramItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useFinancePrograms({
    search,
    financeCategory,
    projectType,
    borrowerProfile,
    dataMode,
    limit: 50,
  });

  const isDatabaseUnavailable =
    axios.isAxiosError(error) && error.response?.status === 503;

  const items = data?.data ?? [];
  const verifiedCount = items.filter((item) => !item.isDemoData && item.verificationStatus === 'verified').length;
  const demoCount = items.filter((item) => item.isDemoData).length;
  const distinctInstitutions = new Set(items.map((item) => item.institutionName)).size;
  const hasFilters = Boolean(search || financeCategory || projectType || borrowerProfile || dataMode !== 'all');

  const resetFilters = () => {
    setSearch('');
    setFinanceCategory('');
    setProjectType('');
    setBorrowerProfile('');
    setDataMode('all');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Green Finance Directory"
        breadcrumbs={[{ label: 'GreenGrid India', to: '/' }, { label: 'Green Finance' }]}
        description="Directory of Indian renewable-energy financing institutions, concessional credit facilities, and green finance programs with official source links and verification dates."
        actions={
          <Badge variant="info" className="gap-1.5">
            <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
            Non-Advisory Directory
          </Badge>
        }
      />

      <div
        role="note"
        className="rounded-xl border border-[#E5B85B] bg-[#FFFBEB] px-4 py-3 text-sm text-[#7A5200] flex items-start gap-3"
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" aria-hidden="true" />
        <div>
          <span className="font-semibold">Non-Advisory Notice:</span> GreenGrid India lists institutional
          programs for discovery only and never quotes interest rates, loan terms, eligibility criteria,
          subsidies, or approval guarantees. Always consult the official source URL before applying.
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <Input
              label="Search Program or Institution"
              placeholder="e.g. IREDA, PFC, Green Bond..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Finance Category"
              value={financeCategory}
              onChange={(e) => setFinanceCategory(e.target.value as FinanceCategory | '')}
              options={[
                { value: '', label: 'All Categories' },
                ...Object.entries(FINANCE_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Supported Project Type"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as FinanceProjectType | '')}
              options={[
                { value: '', label: 'All Project Types' },
                ...Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Borrower Profile"
              value={borrowerProfile}
              onChange={(e) => setBorrowerProfile(e.target.value as FinanceBorrowerProfile | '')}
              options={[
                { value: '', label: 'All Borrowers' },
                ...Object.entries(BORROWER_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Data Mode"
              value={dataMode}
              onChange={(e) => setDataMode(e.target.value as DataModeFilter)}
              options={[
                { value: 'all', label: 'Verified + Demo' },
                { value: 'verified', label: 'Verified Only' },
                { value: 'demo', label: 'Demo Only' },
              ]}
            />
          </div>
          {hasFilters ? (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Reset Filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Programs</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data?.meta.pagination.total ?? items.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Matching current filters</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified Records</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-[#16A36A]">{verifiedCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Audited official listings</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Demo / Sample Records</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-[#D97706]">{demoCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Clearly labeled sample entries</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Institutions</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{distinctInstitutions}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Distinct lenders & agencies</CardContent>
        </Card>
      </div>

      {/* Content States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Loading green finance directory">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isDatabaseUnavailable ? (
        <ErrorState
          title="Database Unavailable (503)"
          message="MongoDB is currently disconnected, so green finance records cannot be queried right now. Connect MongoDB and retry."
          onRetry={() => refetch()}
        />
      ) : isError ? (
        <ErrorState
          title="Failed to load Green Finance Directory"
          message={error instanceof Error ? error.message : 'Unable to fetch green finance programs.'}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" aria-hidden="true" />}
          title="No green finance programs found"
          description="Try clearing filters or switching Data Mode to include sample records."
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item._id} className="flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info">{FINANCE_CATEGORY_LABELS[item.financeCategory]}</Badge>
                    {item.isDemoData ? (
                      <Badge variant="demo">DEMO</Badge>
                    ) : item.verificationStatus === 'verified' ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#64736B] whitespace-nowrap">
                    Verified: {formatDateLabel(item.lastVerifiedAt)}
                  </span>
                </div>
                <CardTitle className="text-lg">{item.programName}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-[#17231F] font-medium">
                  <Building2 className="w-4 h-4 text-[#16A36A] shrink-0" aria-hidden="true" />
                  {item.institutionName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#42524A] line-clamp-3">{item.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.supportedProjectTypes.map((type) => (
                    <Badge key={type} variant="neutral">
                      {PROJECT_TYPE_LABELS[type]}
                    </Badge>
                  ))}
                </div>
                <div className="pt-3 border-t border-[#DCE6DF] flex items-center justify-between gap-3 flex-wrap">
                  <a
                    href={item.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#16A36A] hover:underline"
                  >
                    Official Source
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedProgram(item)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={Boolean(selectedProgram)}
        onClose={() => setSelectedProgram(null)}
        title={selectedProgram?.programName ?? 'Finance Program Details'}
        description={selectedProgram?.institutionName}
      >
        {selectedProgram ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">
                {FINANCE_CATEGORY_LABELS[selectedProgram.financeCategory]}
              </Badge>
              {selectedProgram.isDemoData ? (
                <Badge variant="demo">DEMO</Badge>
              ) : selectedProgram.verificationStatus === 'verified' ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
              <Badge variant="neutral">
                Last verified: {formatDateLabel(selectedProgram.lastVerifiedAt)}
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-[#17231F] mb-1">Overview</h4>
              <p className="text-[#42524A] leading-relaxed">{selectedProgram.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-[#17231F] mb-1">Supported Project Types</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedProgram.supportedProjectTypes.map((type) => (
                  <Badge key={type} variant="neutral">
                    {PROJECT_TYPE_LABELS[type]}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-[#17231F] mb-1">Borrower Profiles</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedProgram.borrowerProfiles.map((profile) => (
                  <Badge key={profile} variant="neutral">
                    {BORROWER_LABELS[profile]}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E5B85B] bg-[#FFFBEB] p-3 text-xs text-[#7A5200]">
              {selectedProgram.termsNote ||
                'Consult the official institution circular for current terms; GreenGrid India does not quote interest rates, loan terms, or approval guarantees.'}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
              {selectedProgram.sourceRef ? (
                <span className="text-xs text-[#64736B]">
                  Source Registry: {selectedProgram.sourceRef.sourceName}
                </span>
              ) : (
                <span className="text-xs text-[#64736B]">Direct official institution reference</span>
              )}
              <a
                href={selectedProgram.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A36A] text-white text-xs font-medium hover:bg-[#138A59] transition-colors"
              >
                Open Official Source
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
