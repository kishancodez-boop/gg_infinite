import axios from 'axios';
import {
  AlertTriangle,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  Scale,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
  Table,
  Tabs,
} from '../components/ui';
import type { BadgeVariant, TableColumn } from '../components/ui';
import { usePolicies } from '../hooks/usePolicies';
import type {
  PolicySchemeItem,
  PolicyStatus,
  PolicyTechnology,
  SchemeCategory,
  VerificationStatus,
} from '../types/policy';

const TECHNOLOGY_LABELS: Record<PolicyTechnology, string> = {
  solar: 'Solar',
  wind: 'Wind',
  hybrid: 'Hybrid',
  storage: 'Energy Storage',
  grid: 'Grid & Transmission',
  efficiency: 'Energy Efficiency',
  general: 'General / Multi-Tech',
};

const SCHEME_CATEGORY_LABELS: Record<SchemeCategory, string> = {
  subsidy: 'Subsidy',
  incentive: 'Incentive',
  regulatory_policy: 'Regulatory Policy',
  tariff_order: 'Tariff Order',
  mission: 'National / State Mission',
  other: 'Other',
};

function getVerificationBadge(status: VerificationStatus): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'verified':
      return { label: 'Verified Official', variant: 'success' };
    case 'needs_review':
      return { label: 'Needs Review', variant: 'warning' };
    case 'rejected':
      return { label: 'Rejected', variant: 'danger' };
    default:
      return { label: 'Unverified', variant: 'neutral' };
  }
}

function getStatusBadge(status?: PolicyStatus): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success' };
    case 'inactive':
      return { label: 'Inactive', variant: 'neutral' };
    default:
      return { label: 'Unknown', variant: 'warning' };
  }
}

function formatDateOrFallback(iso: string | null | undefined): string {
  if (!iso) return 'Not available';
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toISOString().slice(0, 10);
}

export function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'policy' | 'scheme'>('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [jurisdiction, setJurisdiction] = useState<'central' | 'state' | ''>('');
  const [stateOrRegion, setStateOrRegion] = useState('');
  const [technology, setTechnology] = useState<PolicyTechnology | ''>('');
  const [schemeCategory, setSchemeCategory] = useState<SchemeCategory | ''>('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [status, setStatus] = useState<PolicyStatus | ''>('');
  const [dataMode, setDataMode] = useState<'all' | 'verified' | 'demo'>('all');
  const [selectedItem, setSelectedItem] = useState<PolicySchemeItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const policiesQuery = usePolicies({
    page,
    limit: 10,
    recordKind: activeTab,
    search: debouncedSearch,
    jurisdiction,
    stateOrRegion,
    technology,
    schemeCategory,
    issuingOrganization,
    status,
    dataMode,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setJurisdiction('');
    setStateOrRegion('');
    setTechnology('');
    setSchemeCategory('');
    setIssuingOrganization('');
    setStatus('');
    setDataMode('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchInput ||
      jurisdiction ||
      stateOrRegion ||
      technology ||
      schemeCategory ||
      issuingOrganization ||
      status ||
      dataMode !== 'all'
  );

  const items = policiesQuery.data?.data ?? [];
  const pagination = policiesQuery.data?.meta.pagination;
  const demoCount = items.filter((item) => item.isDemoData).length;
  const verifiedCount = items.filter(
    (item) => !item.isDemoData && item.verificationStatus === 'verified'
  ).length;

  const getErrorContent = (): { title: string; message: string } => {
    const err = policiesQuery.error;
    if (axios.isAxiosError(err) && err.response?.status === 503) {
      return {
        title: 'MongoDB Not Connected (503 Service Unavailable)',
        message:
          'The Policies & Schemes Explorer requires an active MongoDB connection. Configure MONGODB_URI in server/.env to query stored policies and schemes. No fabricated records are displayed.',
      };
    }
    return {
      title: 'Unable to Load Policies & Schemes',
      message:
        'Could not reach /api/v1/policies or /api/v1/schemes. Verify the Express API is running and retry.',
    };
  };

  const columns: TableColumn<PolicySchemeItem>[] = [
    {
      key: 'title',
      header: 'Policy / Scheme',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-[#17231F]">{row.title}</span>
            <Badge variant={row.recordKind === 'scheme' ? 'info' : 'forest'}>
              {row.recordKind === 'scheme' ? 'Scheme' : 'Policy'}
            </Badge>
            {row.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
          </div>
          <p className="text-xs text-[#64736B]">{row.issuingOrganization}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Tech',
      render: (row) => {
        const tech = row.technology ?? row.category;
        const cat = row.schemeCategory ?? 'other';
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-medium text-[#17231F]">
              {SCHEME_CATEGORY_LABELS[cat] ?? cat}
            </p>
            <p className="text-[#64736B]">{TECHNOLOGY_LABELS[tech] ?? tech}</p>
          </div>
        );
      },
    },
    {
      key: 'scope',
      header: 'Scope',
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium capitalize text-[#17231F]">{row.jurisdiction}</span>
          <p className="text-[#64736B]">{row.stateOrRegion || 'All India'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status & Provenance',
      render: (row) => {
        const ver = getVerificationBadge(row.verificationStatus);
        const st = getStatusBadge(row.status);
        return (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={st.variant}>{st.label}</Badge>
            <Badge variant={ver.variant}>{ver.label}</Badge>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Source & Details',
      render: (row) => (
        <div className="flex items-center gap-2">
          <a
            href={row.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#16A36A] hover:text-[#102A25]"
          >
            Source
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItem(row)}
            leftIcon={<Eye className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  const explorerContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Search &amp; Filter Policies and Schemes</CardTitle>
              <CardDescription>
                Filter by scope, state, renewable technology, category, issuing authority, status,
                or verification mode.
              </CardDescription>
            </div>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-3.5 h-3.5 mr-1" />
                Reset Filters
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <Input
                label="Search Titles & Descriptions"
                placeholder="Search PM-KUSUM, rooftop solar, tariff, MNRE..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            {searchInput ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                  setPage(1);
                }}
              >
                Clear Search
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Scope"
              value={jurisdiction}
              onChange={(e) => {
                setJurisdiction(e.target.value as 'central' | 'state' | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Scopes (Central & State)' },
                { value: 'central', label: 'Central / National' },
                { value: 'state', label: 'State-Level' },
              ]}
            />
            <Input
              label="State / Region"
              placeholder="e.g. Gujarat, Rajasthan..."
              value={stateOrRegion}
              onChange={(e) => {
                setStateOrRegion(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Renewable Technology"
              value={technology}
              onChange={(e) => {
                setTechnology(e.target.value as PolicyTechnology | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Technologies' },
                ...Object.entries(TECHNOLOGY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Select
              label="Category"
              value={schemeCategory}
              onChange={(e) => {
                setSchemeCategory(e.target.value as SchemeCategory | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Categories' },
                ...Object.entries(SCHEME_CATEGORY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <Input
              label="Issuing Authority"
              placeholder="e.g. MNRE, BEE, GEDA..."
              value={issuingOrganization}
              onChange={(e) => {
                setIssuingOrganization(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Record Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PolicyStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'unknown', label: 'Unknown' },
              ]}
            />
          </div>

          <div className="max-w-xs">
            <Select
              label="Data Provenance Mode"
              value={dataMode}
              onChange={(e) => {
                setDataMode(e.target.value as 'all' | 'verified' | 'demo');
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All (Verified + DEMO)' },
                { value: 'verified', label: 'Verified Only' },
                { value: 'demo', label: 'DEMO Sample Records Only' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {policiesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : policiesQuery.isError ? (
        <ErrorState
          title={getErrorContent().title}
          message={getErrorContent().message}
          onRetry={() => policiesQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Scale className="w-6 h-6" />}
          title="No matching policies or schemes found"
          description="Adjust your search terms or filters to view stored records."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Clear All Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <Table columns={columns} data={items} rowKey={(row) => row._id} />
          {pagination && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#64736B]">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
                record{pagination.total === 1 ? '' : 's'})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies & Schemes Explorer"
        description="Searchable repository of Indian renewable-energy policies and government schemes with explicit source attribution, verification dates, and DEMO separation."
        breadcrumbs={[{ label: 'Policies & Schemes' }]}
        badge={
          pagination ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="forest">{pagination.total} Matching</Badge>
              <Badge variant="success">{verifiedCount} Verified</Badge>
              {demoCount > 0 ? <Badge variant="warning">{demoCount} DEMO</Badge> : null}
            </div>
          ) : undefined
        }
      />

      <Tabs
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab as 'all' | 'policy' | 'scheme');
          setPage(1);
        }}
        ariaLabel="Policy and scheme record types"
        items={[
          {
            id: 'all',
            label: 'All',
            icon: <Layers className="w-4 h-4" />,
            content: explorerContent,
          },
          {
            id: 'policy',
            label: 'Policies',
            icon: <Scale className="w-4 h-4" />,
            content: explorerContent,
          },
          {
            id: 'scheme',
            label: 'Schemes',
            icon: <FileText className="w-4 h-4" />,
            content: explorerContent,
          },
        ]}
      />

      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        variant="drawer"
        title={selectedItem?.title ?? 'Policy / Scheme Details'}
        description={selectedItem?.issuingOrganization}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>
            Close
          </Button>
        }
      >
        {selectedItem && (
          <div className="space-y-4 text-xs text-[#17231F]">
            {selectedItem.isDemoData ? (
              <div className="rounded-lg border border-[#F4B942]/60 bg-[#FFFBEB] p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  <strong>DEMO Sample Record:</strong> This entry is marked{' '}
                  <code>isDemoData: true</code> for demonstration and is not verified official
                  government guidance.
                </span>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedItem.recordKind === 'scheme' ? 'info' : 'forest'}>
                {selectedItem.recordKind === 'scheme' ? 'Scheme' : 'Policy'}
              </Badge>
              <Badge variant={getStatusBadge(selectedItem.status).variant}>
                {getStatusBadge(selectedItem.status).label}
              </Badge>
              <Badge variant={getVerificationBadge(selectedItem.verificationStatus).variant}>
                {getVerificationBadge(selectedItem.verificationStatus).label}
              </Badge>
              {selectedItem.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-[#102A25]">Description</p>
              <p className="text-[#64736B] leading-relaxed">{selectedItem.description}</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-[#102A25]">Eligibility</p>
              <p className="text-[#64736B] leading-relaxed">
                {selectedItem.eligibility?.trim() || 'Not available'}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF]">
              <div>
                <dt className="text-[#64736B]">Issuing Authority</dt>
                <dd className="font-medium mt-0.5">{selectedItem.issuingOrganization}</dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Scope / State</dt>
                <dd className="font-medium capitalize mt-0.5">
                  {selectedItem.jurisdiction} ({selectedItem.stateOrRegion || 'All India'})
                </dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Technology</dt>
                <dd className="font-medium mt-0.5">
                  {TECHNOLOGY_LABELS[selectedItem.technology ?? selectedItem.category] ??
                    selectedItem.category}
                </dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Category</dt>
                <dd className="font-medium mt-0.5">
                  {SCHEME_CATEGORY_LABELS[selectedItem.schemeCategory ?? 'other'] ?? 'Other'}
                </dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Effective Date</dt>
                <dd className="font-mono mt-0.5">
                  {formatDateOrFallback(selectedItem.effectiveDate)}
                </dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Expiry / Deadline</dt>
                <dd className="font-mono mt-0.5">
                  {formatDateOrFallback(selectedItem.expiryDate)}
                </dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Last Verified</dt>
                <dd className="font-mono mt-0.5">
                  {formatDateOrFallback(selectedItem.lastVerifiedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Source Reference</dt>
                <dd className="font-medium mt-0.5">
                  {typeof selectedItem.sourceRef === 'object' && selectedItem.sourceRef
                    ? selectedItem.sourceRef.sourceName || selectedItem.sourceRef.domain || 'Official Registry'
                    : 'Official Registry'}
                </dd>
              </div>
            </dl>

            <a
              href={selectedItem.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#16A36A] hover:text-[#102A25]"
            >
              Open Official Source URL
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}

