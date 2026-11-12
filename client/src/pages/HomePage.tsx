import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  Database,
  ExternalLink,
  Layers,
  ShieldCheck,
  Sun,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { PageHeader } from '../components/layout/PageHeader';
import { SystemStatusPanel } from '../components/SystemStatusPanel';
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
  useToast,
} from '../components/ui';
import type { TableColumn } from '../components/ui';
import { useNationalDashboard } from '../hooks/useNationalDashboard';
import type {
  DashboardDataMode,
  DashboardTechnology,
  NationalDashboardSummary,
} from '../types/dashboard';

function formatCapacityMw(value: number | null): string {
  if (value === null) return 'Not available';
  return `${value.toLocaleString('en-IN')} MW`;
}

export function HomePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const { pushToast } = useToast();
  const [stateOrRegion, setStateOrRegion] = useState('');
  const [technology, setTechnology] = useState<DashboardTechnology>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dataMode, setDataMode] = useState<DashboardDataMode>('all');

  const dashboardQuery = useNationalDashboard({
    dataMode,
    stateOrRegion,
    technology,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const resetFilters = () => {
    setStateOrRegion('');
    setTechnology('all');
    setFromDate('');
    setToDate('');
    setDataMode('all');
  };

  const hasFilters = Boolean(
    stateOrRegion || technology !== 'all' || fromDate || toDate || dataMode !== 'all'
  );

  const data = dashboardQuery.data;
  const isDbUnavailable =
    axios.isAxiosError(dashboardQuery.error) && dashboardQuery.error.response?.status === 503;

  const stateColumns: TableColumn<NationalDashboardSummary['stateRankings'][number]>[] = [
    {
      key: 'rank',
      header: 'Rank',
      render: (row) => <span className="font-bold text-[#102A25]">#{row.rank}</span>,
    },
    {
      key: 'state',
      header: 'State / Region',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#17231F]">{row.stateOrRegion}</span>
          {row.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Capacity',
      render: (row) => (
        <span className="font-semibold text-[#16A36A]">
          {row.capacityMw.toLocaleString('en-IN')} MW
        </span>
      ),
    },
    {
      key: 'solar',
      header: 'Solar',
      render: (row) => <span className="text-xs">{formatCapacityMw(row.solarMw)}</span>,
    },
    {
      key: 'wind',
      header: 'Wind',
      render: (row) => <span className="text-xs">{formatCapacityMw(row.windMw)}</span>,
    },
    {
      key: 'other',
      header: 'Other',
      render: (row) => <span className="text-xs">{formatCapacityMw(row.otherMw)}</span>,
    },
  ];

  const updateColumns: TableColumn<NationalDashboardSummary['recentUpdates'][number]>[] = [
    {
      key: 'metric',
      header: 'Metric',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-[#17231F]">{row.metricName}</span>
            {row.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
          </div>
          <p className="text-xs text-[#64736B]">{row.stateOrRegion}</p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Reported Value',
      render: (row) => (
        <span className="font-semibold text-[#102A25]">
          {row.value.toLocaleString('en-IN')} {row.unit}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Reporting Date',
      render: (row) => <span className="text-xs font-mono">{row.observationDate}</span>,
    },
    {
      key: 'source',
      header: 'Source Attribution',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#16A36A] hover:text-[#102A25]"
          >
            {row.sourceName}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <p className="text-[#64736B]">
            Retrieved: {row.retrievedAt} · {row.verificationStatus}
          </p>
        </div>
      ),
    },
  ];

  const overviewContent = (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Dashboard Filters</CardTitle>
              <CardDescription>
                Filter stored metrics by state/region, technology, reporting period, or data mode.
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
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label="State / Region"
            placeholder="e.g. Rajasthan, India..."
            value={stateOrRegion}
            onChange={(e) => setStateOrRegion(e.target.value)}
          />
          <Select
            label="Technology"
            value={technology}
            onChange={(e) => setTechnology(e.target.value as DashboardTechnology)}
            options={[
              { value: 'all', label: 'All Technologies' },
              { value: 'solar', label: 'Solar' },
              { value: 'wind', label: 'Wind' },
              { value: 'other', label: 'Other Renewable' },
            ]}
          />
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Select
            label="Data Mode"
            value={dataMode}
            onChange={(e) => setDataMode(e.target.value as DashboardDataMode)}
            options={[
              { value: 'all', label: 'All (Verified + DEMO)' },
              { value: 'verified', label: 'Verified Only' },
              { value: 'demo', label: 'DEMO Sample Only' },
            ]}
          />
        </CardContent>
      </Card>

      {dashboardQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : dashboardQuery.isError ? (
        <ErrorState
          title={
            isDbUnavailable
              ? 'MongoDB Not Connected (503 Service Unavailable)'
              : 'Unable to Load National Dashboard'
          }
          message={
            isDbUnavailable
              ? 'Configure MONGODB_URI in server/.env to query stored EnergyMetric records. No fabricated national capacity or state rankings are displayed.'
              : 'Could not reach /api/v1/dashboard/national. Ensure the Express API is running and retry.'
          }
          onRetry={() => dashboardQuery.refetch()}
        />
      ) : !data || data.meta.recordCount === 0 ? (
        <EmptyState
          icon={<Database className="w-6 h-6" />}
          title="No renewable energy metrics stored yet"
          description="No matching EnergyMetric records exist in MongoDB for the selected filters. Publish approved REA records or run the explicit demo seed to populate sample metrics."
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
                <strong>DEMO Data Notice:</strong> Some or all displayed metrics are marked{' '}
                <code>isDemoData: true</code> for demonstration and do not represent live official
                MNRE/CEA statistics.
              </span>
            </div>
          ) : null}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Total Renewable Capacity</span>
                  <Zap className="w-4 h-4 text-[#16A36A]" />
                </div>
                <p className="text-xl font-bold text-[#102A25] mt-1.5">
                  {formatCapacityMw(data.kpis.totalRenewableCapacityMw)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Solar Capacity</span>
                  <Sun className="w-4 h-4 text-[#F4B942]" />
                </div>
                <p className="text-xl font-bold text-[#102A25] mt-1.5">
                  {formatCapacityMw(data.kpis.solarCapacityMw)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Wind Capacity</span>
                  <Wind className="w-4 h-4 text-[#16A36A]" />
                </div>
                <p className="text-xl font-bold text-[#102A25] mt-1.5">
                  {formatCapacityMw(data.kpis.windCapacityMw)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Other Renewable</span>
                  <Activity className="w-4 h-4 text-[#102A25]" />
                </div>
                <p className="text-xl font-bold text-[#102A25] mt-1.5">
                  {formatCapacityMw(data.kpis.otherRenewableCapacityMw)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>Latest Generation</span>
                  {data.kpis.latestGeneration?.isDemoData ? (
                    <Badge variant="warning">DEMO</Badge>
                  ) : null}
                </div>
                {data.kpis.latestGeneration ? (
                  <>
                    <p className="text-xl font-bold text-[#16A36A] mt-1.5">
                      {data.kpis.latestGeneration.value.toLocaleString('en-IN')}{' '}
                      {data.kpis.latestGeneration.unit}
                    </p>
                    <p className="text-[11px] text-[#64736B] mt-0.5">
                      {data.kpis.latestGeneration.stateOrRegion} ·{' '}
                      {data.kpis.latestGeneration.observationDate.slice(0, 10)}
                    </p>
                  </>
                ) : (
                  <p className="text-base font-semibold text-[#64736B] mt-1.5">Not available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <DashboardCharts energyMix={data.energyMix} trends={data.trends} />

          {/* State Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>State-Wise Renewable Energy Comparison</CardTitle>
              <CardDescription>
                Rankings are derived strictly from stored state-level capacity records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.stateRankings.length === 0 ? (
                <p className="text-xs text-[#64736B]">
                  No state-level capacity records available for ranking under current filters.
                </p>
              ) : (
                <Table
                  columns={stateColumns}
                  data={data.stateRankings}
                  rowKey={(row) => row.stateOrRegion}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Updates & Source Attribution */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Data Updates &amp; Source Attribution</CardTitle>
              <CardDescription>
                Last retrieved timestamp:{' '}
                {data.meta.lastUpdatedAt ? data.meta.lastUpdatedAt.slice(0, 10) : 'Not available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table
                columns={updateColumns}
                data={data.recentUpdates}
                rowKey={(row) => row.id}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <SystemStatusPanel />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="National Renewable Energy Dashboard"
        description="India-focused renewable capacity, energy mix, state comparisons, and source-attributed updates from stored EnergyMetric records."
        breadcrumbs={[{ label: 'National Dashboard' }]}
        badge={
          data?.meta.hasDemoData ? (
            <Badge variant="warning">
              {data.meta.hasVerifiedData ? 'Includes DEMO Records' : 'DEMO Data Only'}
            </Badge>
          ) : data?.meta.hasVerifiedData ? (
            <Badge variant="success">Verified Records</Badge>
          ) : undefined
        }
      />

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Dashboard views"
        items={[
          {
            id: 'overview',
            label: 'National Overview',
            icon: <Zap className="w-3.5 h-3.5" />,
            content: overviewContent,
          },
          {
            id: 'preview',
            label: 'Design System Preview',
            icon: <Layers className="w-3.5 h-3.5" />,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Reusable Eco-Tech UI Components</CardTitle>
                  <CardDescription>
                    Interactive verification of modals, toasts, and provenance standards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      pushToast({
                        title: 'Eco-Tech Toast Notification',
                        description: 'Toast notifications are active and accessible.',
                        variant: 'success',
                      })
                    }
                  >
                    Trigger Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSchemaModalOpen(true)}
                  >
                    Open Provenance Modal
                  </Button>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      <Modal
        open={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        title="Source Provenance & Data Integrity Standard"
        description="All verified data tracks original source, URL, retrieval date, and verification status."
      >
        <div className="flex items-start gap-2.5 text-xs text-[#64736B]">
          <ShieldCheck className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
          <p>
            Missing metrics display &ldquo;Not available&rdquo; instead of zero, and demo records
            are visibly labeled DEMO.
          </p>
        </div>
      </Modal>
    </div>
  );
}
