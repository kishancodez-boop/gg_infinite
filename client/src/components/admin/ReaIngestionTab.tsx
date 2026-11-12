import axios from 'axios';
import { AlertTriangle, Database, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
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
  useToast,
} from '../ui';
import type { BadgeVariant, TableColumn } from '../ui';
import { useIngestionRuns, useReaMutations } from '../../hooks/useRea';
import { useSources } from '../../hooks/useSources';
import type { IngestionRunItem, RunReaIngestResult } from '../../types/rea';

function getRunStatusVariant(status: IngestionRunItem['status']): BadgeVariant {
  switch (status) {
    case 'completed':
      return 'success';
    case 'partial':
    case 'dry_run':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function ReaIngestionTab({
  adminKey,
  onAdminKeyChange,
}: {
  adminKey: string;
  onAdminKeyChange: (value: string) => void;
}) {
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [mode, setMode] = useState<'fixture' | 'live'>('fixture');
  const [dryRun, setDryRun] = useState(true);
  const [lastResult, setLastResult] = useState<RunReaIngestResult | null>(null);

  const sourcesQuery = useSources({ page: 1, limit: 50, sortBy: 'sourceName', sortOrder: 'asc' });
  const runsQuery = useIngestionRuns({ page, limit: 10 });
  const { ingestMutation } = useReaMutations();

  const sourceList = sourcesQuery.data?.data ?? [];
  const effectiveSourceId = selectedSourceId || sourceList[0]?._id || '';

  const handleRunIngestion = async () => {
    if (!effectiveSourceId) {
      pushToast({ title: 'Select a registered source first.', variant: 'warning' });
      return;
    }

    try {
      const response = await ingestMutation.mutateAsync({
        sourceId: effectiveSourceId,
        mode,
        format,
        dryRun,
        adminKey,
      });
      setLastResult(response.data);
      pushToast({
        title: dryRun
          ? 'Dry-run preview completed (no records written).'
          : `REA run completed: ${response.data.summary.recordsStaged} record(s) staged for review.`,
        variant: 'success',
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage =
          (error.response?.data as { error?: { message?: string } } | undefined)?.error
            ?.message ?? error.message;
        pushToast({ title: apiMessage, variant: 'error' });
      } else {
        pushToast({ title: 'Failed to execute REA ingestion run.', variant: 'error' });
      }
    }
  };

  const columns: TableColumn<IngestionRunItem>[] = [
    {
      key: 'startedAt',
      header: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-[#64736B]">
          {new Date(row.startedAt).toISOString().replace('T', ' ').slice(0, 19)}
        </span>
      ),
    },
    {
      key: 'mode',
      header: 'Mode / Demo',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={row.sourceMode === 'live' ? 'info' : 'warning'}>
            {row.sourceMode === 'live' ? 'Live' : 'Fixture'}
          </Badge>
          {row.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={getRunStatusVariant(row.status)}>{row.status.toUpperCase()}</Badge>
      ),
    },
    {
      key: 'counts',
      header: 'Processed / Accepted / Rejected / Dup',
      render: (row) => (
        <span className="text-xs font-medium text-[#17231F]">
          {row.recordsProcessed} / {row.recordsAccepted} / {row.recordsRejected} /{' '}
          {row.recordsDuplicate ?? 0}
        </span>
      ),
    },
    {
      key: 'errorSummary',
      header: 'Notes',
      render: (row) => (
        <span className="text-xs text-[#64736B]">{row.errorSummary || row.fixtureLabel || '—'}</span>
      ),
    },
  ];

  const isDbUnavailable =
    axios.isAxiosError(runsQuery.error) && runsQuery.error.response?.status === 503;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>REA Safe Ingestion Runner</CardTitle>
              <CardDescription>
                Executes Source Registry → Permission Check → Fetch/Fixture → Parse → Normalize →
                Validate → Deduplicate → Stage for Human Review.
              </CardDescription>
            </div>
            <Badge variant="warning">DEMO Fixture Safe Mode</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5] p-3 text-xs text-[#17231F] flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F4B942] shrink-0 mt-0.5" />
            <span>
              Live automated ingestion is restricted to verified non-manual sources with valid
              credentials. Use <strong>Fixture (DEMO)</strong> mode to test CSV/JSON parsing,
              validation, deduplication, and staging without external scraping.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select
              label="Registered Source"
              value={effectiveSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              options={
                sourceList.length > 0
                  ? sourceList.map((s) => ({
                      value: s._id,
                      label: `${s.sourceName} (${s.accessMethod})`,
                    }))
                  : [{ value: '', label: 'Requires MongoDB connection' }]
              }
            />
            <Select
              label="Execution Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'fixture' | 'live')}
              options={[
                { value: 'fixture', label: 'Fixture (DEMO)' },
                { value: 'live', label: 'Live (Permitted Only)' },
              ]}
            />
            <Select
              label="Payload Format"
              value={format}
              onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
              options={[
                { value: 'csv', label: 'CSV Sample' },
                { value: 'json', label: 'JSON Sample' },
              ]}
            />
            <Select
              label="Run Type"
              value={dryRun ? 'dry_run' : 'stage'}
              onChange={(e) => setDryRun(e.target.value === 'dry_run')}
              options={[
                { value: 'dry_run', label: 'Dry-Run Preview' },
                { value: 'stage', label: 'Stage for Review' },
              ]}
            />
            <Input
              label="Admin Key (x-admin-key)"
              type="password"
              value={adminKey}
              onChange={(e) => onAdminKeyChange(e.target.value)}
              placeholder="Required to trigger run"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleRunIngestion}
              disabled={ingestMutation.isPending || !effectiveSourceId}
            >
              <Play className="h-4 w-4 mr-1.5" />
              {dryRun ? 'Run Dry-Run Preview' : 'Stage Records for Review'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => runsQuery.refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh Runs
            </Button>
          </div>

          {lastResult ? (
            <div className="rounded-lg border border-[#DCE6DF] bg-white p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#16A36A]" />
                <span className="text-sm font-semibold text-[#17231F]">
                  {lastResult.dryRun ? 'Dry-Run Preview' : 'Staged Ingestion Run'} —{' '}
                  {lastResult.source.sourceName}
                </span>
                {lastResult.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
                <Badge variant="info">{lastResult.status.toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-[#64736B]">{lastResult.permission.reason}</p>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs pt-1">
                <div>Processed: {lastResult.summary.recordsProcessed}</div>
                <div>Accepted: {lastResult.summary.recordsAccepted}</div>
                <div>Rejected: {lastResult.summary.recordsRejected}</div>
                <div>Staged: {lastResult.summary.recordsStaged}</div>
                <div>Duplicates: {lastResult.summary.recordsDuplicate}</div>
                <div>Changed: {lastResult.summary.recordsChanged}</div>
              </div>
              {lastResult.validationErrors.length > 0 ? (
                <div className="text-xs text-[#B91C1C] bg-[#FEF2F2] rounded p-2">
                  Validation errors:{' '}
                  {lastResult.validationErrors
                    .map((e) => `Row ${e.rowIndex} (${e.field}): ${e.message}`)
                    .join(' | ')}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingestion Run History</CardTitle>
          <CardDescription>
            Recorded REA pipeline runs from MongoDB (`/api/v1/ingestion-runs`).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runsQuery.isLoading ? (
            <SkeletonCard />
          ) : runsQuery.isError ? (
            <ErrorState
              title={
                isDbUnavailable
                  ? 'MongoDB Not Connected (503 Service Unavailable)'
                  : 'Unable to Load Ingestion Runs'
              }
              message={
                isDbUnavailable
                  ? 'Configure MONGODB_URI in server/.env to persist and inspect REA ingestion runs.'
                  : 'Could not reach /api/v1/ingestion-runs.'
              }
              onRetry={() => runsQuery.refetch()}
            />
          ) : (runsQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Database className="w-6 h-6" />}
              title="No ingestion runs recorded yet"
              description="Run a staged REA ingestion above (with MongoDB & ADMIN_API_KEY configured) to record run history."
            />
          ) : (
            <div className="space-y-3">
              <Table
                columns={columns}
                data={runsQuery.data?.data ?? []}
                rowKey={(row) => row._id}
              />
              {runsQuery.data?.meta.pagination && (
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>
                    Page {runsQuery.data.meta.pagination.page} of{' '}
                    {runsQuery.data.meta.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!runsQuery.data.meta.pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!runsQuery.data.meta.pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

