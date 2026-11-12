import axios from 'axios';
import {
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  Lock,
  Search,
  ShieldAlert,
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
  Table,
} from '../components/ui';
import type { BadgeVariant, TableColumn } from '../components/ui';
import { useSources } from '../hooks/useSources';
import type { DataSourceItem, VerificationStatus } from '../types/source';

const CATEGORY_LABELS: Record<string, string> = {
  capacity_generation: 'Capacity & Generation',
  solar_wind: 'Solar & Wind',
  policies_schemes: 'Policies & Schemes',
  rpo_regulations: 'RPO & Regulations',
  state_statistics: 'State Statistics',
  green_finance: 'Green Finance',
  tenders_opportunities: 'Tenders & Opportunities',
  general: 'General',
};

function getVerificationBadge(status: VerificationStatus): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'verified':
      return { label: 'Verified Official', variant: 'success' };
    case 'needs_review':
      return { label: 'Candidate (Needs Review)', variant: 'warning' };
    case 'rejected':
      return { label: 'Rejected / Unavailable', variant: 'danger' };
    default:
      return { label: 'Unverified', variant: 'neutral' };
  }
}

function formatCheckedDate(iso: string | null): string {
  if (!iso) return 'Not checked';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toISOString().slice(0, 10);
}

export function AdminSourcesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dataCategory, setDataCategory] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [active, setActive] = useState('');
  const [selectedSource, setSelectedSource] = useState<DataSourceItem | null>(null);

  const sourcesQuery = useSources({
    page,
    limit: 10,
    search,
    dataCategory,
    verificationStatus,
    active,
    sortBy: 'sourceName',
    sortOrder: 'asc',
  });

  const getErrorMessage = (): { title: string; message: string } => {
    const err = sourcesQuery.error;
    if (axios.isAxiosError(err) && err.response?.status === 503) {
      return {
        title: 'MongoDB Not Connected (503 Service Unavailable)',
        message:
          'The Source Registry requires an active MongoDB connection. Configure MONGODB_URI in server/.env and run npm --prefix server run seed:sources to load the researched catalogue. No fake records are shown.',
      };
    }
    return {
      title: 'Unable to Load Source Registry',
      message:
        'Could not fetch /api/v1/sources. Ensure the Express API is running and retry.',
    };
  };

  const columns: TableColumn<DataSourceItem>[] = [
    {
      key: 'sourceName',
      header: 'Source & Organization',
      render: (row) => (
        <div className="space-y-0.5 max-w-xs">
          <p className="font-medium text-[#17231F] text-sm leading-snug">{row.sourceName}</p>
          <p className="text-xs text-[#64736B]">{row.organization}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="text-xs font-medium text-[#17231F]">
          {CATEGORY_LABELS[row.dataCategory] ?? row.dataCategory}
        </span>
      ),
    },
    {
      key: 'accessMethod',
      header: 'Access',
      render: (row) => <Badge variant="info">{row.accessMethod}</Badge>,
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      render: (row) => {
        const badge = getVerificationBadge(row.verificationStatus);
        return (
          <Badge
            variant={badge.variant}
            icon={
              row.verificationStatus === 'verified' ? (
                <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
              ) : (
                <Clock className="w-3 h-3" />
              )
            }
          >
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: 'active',
      header: 'State',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'neutral'}>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastCheckedAt',
      header: 'Last Checked',
      render: (row) => (
        <span className="text-xs font-mono text-[#64736B]">
          {formatCheckedDate(row.lastCheckedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      className: 'text-right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-2">
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open official source ${row.sourceName}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#16A36A] hover:text-[#102A25] px-2 py-1 rounded"
          >
            URL
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSource(row)}
            leftIcon={<Eye className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  const items = sourcesQuery.data?.data ?? [];
  const pagination = sourcesQuery.data?.meta.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Data Source Registry"
        description="Auditable directory of verified official Indian renewable-energy portals and candidate sources awaiting human verification."
        breadcrumbs={[{ label: 'Admin / REA Source Registry' }]}
        badge={
          <Badge variant="forest" icon={<Lock className="w-3 h-3" />}>
            Read-Only Registry
          </Badge>
        }
      />

      <Card className="bg-[#F5F8F5]/70">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-[#64736B] leading-relaxed">
            <p className="font-semibold text-[#17231F]">
              Security &amp; Ingestion Guardrail Active
            </p>
            <p className="mt-0.5">
              Source write/delete endpoints (`POST`, `PATCH`, `DELETE /api/v1/sources`) are
              protected server-side and disabled until admin authentication is configured.
              Automated REA scraping is not enabled in Milestone 04.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filter Sources</CardTitle>
          <CardDescription>
            Search by source name, organization, or domain, and filter by category or verification status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Search Registry"
            placeholder="MNRE, CEA, data.gov.in..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Data Category"
            value={dataCategory}
            onChange={(e) => {
              setDataCategory(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Categories' },
              ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Select
            label="Verification Status"
            value={verificationStatus}
            onChange={(e) => {
              setVerificationStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'verified', label: 'Verified Official' },
              { value: 'needs_review', label: 'Candidate (Needs Review)' },
              { value: 'unverified', label: 'Unverified' },
              { value: 'rejected', label: 'Rejected / Unavailable' },
            ]}
          />
          <Select
            label="Active Status"
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All States' },
              { value: 'true', label: 'Active Only' },
              { value: 'false', label: 'Inactive Only' },
            ]}
          />
        </CardContent>
      </Card>

      {sourcesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sourcesQuery.isError ? (
        <ErrorState
          title={getErrorMessage().title}
          message={getErrorMessage().message}
          onRetry={() => void sourcesQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Database className="w-5 h-5" aria-hidden="true" />}
          title="No Matching Sources Found"
          description="No verified or candidate sources matched the active filters, or the source catalogue has not been seeded into MongoDB yet."
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={items}
            rowKey={(row) => row._id}
            caption="Official Indian renewable energy data source registry"
          />

          {pagination && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#64736B]">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
                sources)
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

      <Modal
        open={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
        variant="drawer"
        title={selectedSource?.sourceName ?? 'Source Details'}
        description={selectedSource?.organization}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedSource(null)}>
            Close
          </Button>
        }
      >
        {selectedSource && (
          <div className="space-y-4 text-xs text-[#17231F]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getVerificationBadge(selectedSource.verificationStatus).variant}>
                {getVerificationBadge(selectedSource.verificationStatus).label}
              </Badge>
              <Badge variant={selectedSource.active ? 'success' : 'neutral'}>
                {selectedSource.active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="info">{selectedSource.accessMethod}</Badge>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-[#102A25]">Description</p>
              <p className="text-[#64736B] leading-relaxed">
                {selectedSource.description || 'No description provided.'}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF]">
              <div>
                <dt className="text-[#64736B]">Domain</dt>
                <dd className="font-mono text-[#17231F] mt-0.5">{selectedSource.domain}</dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Expected Format</dt>
                <dd className="font-medium uppercase mt-0.5">{selectedSource.expectedFormat}</dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Update Cadence</dt>
                <dd className="font-medium mt-0.5">{selectedSource.updateCadence}</dd>
              </div>
              <div>
                <dt className="text-[#64736B]">Last Checked</dt>
                <dd className="font-mono mt-0.5">
                  {formatCheckedDate(selectedSource.lastCheckedAt)}
                </dd>
              </div>
            </dl>

            <div className="space-y-1">
              <p className="font-semibold text-[#102A25]">Access &amp; Permission Notes</p>
              <p className="text-[#64736B] leading-relaxed">
                {selectedSource.accessNotes || 'None recorded.'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-[#102A25]">Verification Evidence</p>
              <p className="text-[#64736B] leading-relaxed">
                {selectedSource.evidenceNotes || 'Pending human verification.'}
              </p>
            </div>

            <a
              href={selectedSource.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#16A36A] hover:text-[#102A25]"
            >
              Visit Canonical Official URL
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}

