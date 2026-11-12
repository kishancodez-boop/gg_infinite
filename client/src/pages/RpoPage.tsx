import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Gauge,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { RpoComparisonChart } from '../components/rpo/RpoComparisonChart';
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
  Select,
  SkeletonCard,
  Table,
} from '../components/ui';
import type { BadgeVariant, TableColumn } from '../components/ui';
import { useRpoSummary } from '../hooks/useRpo';
import type {
  ComputedRpoRecord,
  RpoCategory,
  RpoDataMode,
  RpoEntityType,
} from '../types/rpo';

const CATEGORY_LABELS: Record<RpoCategory, string> = {
  solar: 'Solar RPO',
  wind: 'Wind RPO',
  hpo: 'Hydro (HPO)',
  non_solar: 'Non-Solar RPO',
  total: 'Total RPO',
  other: 'Other',
};

function formatMu(value: number | null): string {
  if (value === null) return 'Not available';
  return `${value.toLocaleString('en-IN')} MU`;
}

function getStatusBadge(status: ComputedRpoRecord['complianceStatus']): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'compliant':
      return { label: 'Compliant', variant: 'success' };
    case 'shortfall':
      return { label: 'Shortfall', variant: 'danger' };
    default:
      return { label: 'Unavailable', variant: 'neutral' };
  }
}

export function RpoPage() {
  const [state, setState] = useState('');
  const [discomName, setDiscomName] = useState('');
  const [entityType, setEntityType] = useState<RpoEntityType | ''>('');
  const [category, setCategory] = useState<RpoCategory | ''>('');
  const [compliancePeriod, setCompliancePeriod] = useState('');
  const [dataMode, setDataMode] = useState<RpoDataMode>('all');

  const rpoQuery = useRpoSummary({
    dataMode,
    state,
    discomName,
    entityType,
    category,
    compliancePeriod,
  });

  const resetFilters = () => {
    setState('');
    setDiscomName('');
    setEntityType('');
    setCategory('');
    setCompliancePeriod('');
    setDataMode('all');
  };

  const hasFilters = Boolean(
    state || discomName || entityType || category || compliancePeriod || dataMode !== 'all'
  );

  const data = rpoQuery.data;
  const isDbUnavailable =
    axios.isAxiosError(rpoQuery.error) && rpoQuery.error.response?.status === 503;

  const columns: TableColumn<ComputedRpoRecord>[] = [
    {
      key: 'entity',
      header: 'State / DISCOM',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-[#17231F]">{row.stateOrOrganization}</span>
            <Badge variant="neutral">{row.entityType.toUpperCase()}</Badge>
            {row.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
          </div>
          <p className="text-xs text-[#64736B]">
            {row.state ? `${row.state} · ` : ''}
            {row.compliancePeriod} · {CATEGORY_LABELS[row.category] ?? row.category}
          </p>
        </div>
      ),
    },
    {
      key: 'targetVsAchieved',
      header: 'Target vs. Reported',
      render: (row) => (
        <div className="text-xs space-y-1 min-w-[140px]">
          <div className="flex justify-between">
            <span>Target: {row.targetPercentage}%</span>
            <span>
              Reported:{' '}
              {row.reportedPercentage !== null ? `${row.reportedPercentage}%` : 'Not available'}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F5F8F5] border border-[#DCE6DF] overflow-hidden">
            <div
              className={`h-full ${
                row.complianceStatus === 'compliant' ? 'bg-[#16A36A]' : 'bg-[#F4B942]'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, row.compliancePercent ?? 0))}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-[#64736B]">
            Compliance:{' '}
            {row.compliancePercent !== null ? `${row.compliancePercent}%` : 'Not available'}
          </p>
        </div>
      ),
    },
    {
      key: 'energy',
      header: 'Energy (MU) & Gap',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <p>Target: {formatMu(row.targetEnergyMu)}</p>
          <p>Achieved: {formatMu(row.achievedEnergyMu)}</p>
          <p className="text-[#64736B]">
            Gap:{' '}
            {row.complianceGapMu !== null
              ? `${row.complianceGapMu} MU`
              : row.complianceGapPercent !== null
                ? `${row.complianceGapPercent}%`
                : 'Not available'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const badge = getStatusBadge(row.complianceStatus);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: 'source',
      header: 'Source & Updated',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          {row.source.sourceUrl ? (
            <a
              href={row.source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#16A36A] hover:text-[#102A25]"
            >
              {row.source.sourceName}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          ) : (
            <span className="font-medium text-[#17231F]">{row.source.sourceName}</span>
          )}
          <p className="text-[#64736B]">
            Updated: {row.lastUpdatedAt ? row.lastUpdatedAt.slice(0, 10) : 'Not available'}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="RPO Compliance Tracker"
        description="Track Renewable Purchase Obligation (RPO) targets, achieved energy, compliance gaps, and source-attributed regulatory filings by state and DISCOM."
        breadcrumbs={[{ label: 'RPO Tracker' }]}
        badge={
          data?.meta.hasDemoData ? (
            <Badge variant="warning">
              {data.meta.hasVerifiedData ? 'Includes DEMO Records' : 'DEMO Data Only'}
            </Badge>
          ) : data?.meta.hasVerifiedData ? (
            <Badge variant="success">Verified Filings</Badge>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Filter RPO Records</CardTitle>
              <CardDescription>
                Filter by state, DISCOM, entity type, technology category, reporting period, or
                data mode.
              </CardDescription>
            </div>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-3.5 h-3.5 mr-1" />
                Reset Filters
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="State"
            placeholder="e.g. Rajasthan, Gujarat..."
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <Input
            label="DISCOM / Utility"
            placeholder="e.g. JVVNL, BESCOM..."
            value={discomName}
            onChange={(e) => setDiscomName(e.target.value)}
          />
          <Select
            label="Entity Type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as RpoEntityType | '')}
            options={[
              { value: '', label: 'All Entity Types' },
              { value: 'state', label: 'State' },
              { value: 'discom', label: 'DISCOM' },
              { value: 'utility', label: 'Utility' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Select
            label="RPO Category / Technology"
            value={category}
            onChange={(e) => setCategory(e.target.value as RpoCategory | '')}
            options={[
              { value: '', label: 'All Categories' },
              ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Input
            label="Reporting Period"
            placeholder="e.g. FY 2024-25"
            value={compliancePeriod}
            onChange={(e) => setCompliancePeriod(e.target.value)}
          />
          <Select
            label="Data Mode"
            value={dataMode}
            onChange={(e) => setDataMode(e.target.value as RpoDataMode)}
            options={[
              { value: 'all', label: 'All (Verified + DEMO)' },
              { value: 'verified', label: 'Verified Only' },
              { value: 'demo', label: 'DEMO Sample Only' },
            ]}
          />
        </CardContent>
      </Card>

      {rpoQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : rpoQuery.isError ? (
        <ErrorState
          title={
            isDbUnavailable
              ? 'MongoDB Not Connected (503 Service Unavailable)'
              : 'Unable to Load RPO Compliance Tracker'
          }
          message={
            isDbUnavailable
              ? 'Configure MONGODB_URI in server/.env to query stored RPO targets and filings. No fabricated compliance figures are displayed.'
              : 'Could not reach /api/v1/rpo/summary. Verify the Express API is running and retry.'
          }
          onRetry={() => rpoQuery.refetch()}
        />
      ) : !data || data.records.length === 0 ? (
        <EmptyState
          icon={<Database className="w-6 h-6" />}
          title="No RPO compliance records found"
          description="No stored RPO targets or filings match your current filter selection."
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {data.meta.hasDemoData ? (
            <div className="rounded-xl border border-[#F4B942]/70 bg-[#FFFBEB] p-3.5 text-xs text-[#17231F] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                <strong>DEMO Data Notice:</strong> Sample RPO records marked <code>DEMO</code> are
                for demonstration only and do not represent official SERC/CERC compliance filings.
              </span>
            </div>
          ) : null}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-[#64736B]">Tracked RPO Records</span>
                <p className="text-xl font-bold text-[#102A25] mt-1">
                  {data.kpis.totalRecords}
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  {data.kpis.compliantCount} compliant · {data.kpis.shortfallCount} shortfall
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Avg Compliance</span>
                  <Gauge className="w-4 h-4 text-[#16A36A]" />
                </div>
                <p className="text-xl font-bold text-[#16A36A] mt-1">
                  {data.kpis.averageCompliancePercent !== null
                    ? `${data.kpis.averageCompliancePercent}%`
                    : 'Not available'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-[#64736B]">Target Energy</span>
                <p className="text-xl font-bold text-[#102A25] mt-1">
                  {formatMu(data.kpis.totalTargetEnergyMu)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Achieved Energy</span>
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
                </div>
                <p className="text-xl font-bold text-[#16A36A] mt-1">
                  {formatMu(data.kpis.totalAchievedEnergyMu)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-[#64736B]">Net Energy Gap</span>
                <p className="text-xl font-bold text-[#102A25] mt-1">
                  {formatMu(data.kpis.totalEnergyGapMu)}
                </p>
              </CardContent>
            </Card>
          </div>

          <RpoComparisonChart records={data.records} />

          <Card>
            <CardHeader>
              <CardTitle>Detailed RPO Compliance Schedule</CardTitle>
              <CardDescription>
                Last updated:{' '}
                {data.meta.lastUpdatedAt ? data.meta.lastUpdatedAt.slice(0, 10) : 'Not available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table
                columns={columns}
                data={data.records}
                rowKey={(row) => row.id}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

