import { CheckCircle2, Database, RefreshCw, Server } from 'lucide-react';
import { useSystemHealth, useSystemStatus } from '../hooks/useSystemHealth';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  SkeletonCard,
} from './ui';

export function SystemStatusPanel() {
  const healthQuery = useSystemHealth();
  const statusQuery = useSystemStatus();

  const isLoading = healthQuery.isLoading || statusQuery.isLoading;
  const isError = healthQuery.isError || statusQuery.isError;

  const handleRetry = () => {
    void healthQuery.refetch();
    void statusQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !healthQuery.data) {
    return (
      <ErrorState
        title="Backend API Unavailable"
        message="Could not reach /api/health. Start the Express server on port 5000 and retry."
        onRetry={handleRetry}
      />
    );
  }

  const health = healthQuery.data;
  const system = statusQuery.data;
  const dbConnected = health.database.connected;

  return (
    <Card aria-label="Live System Connectivity">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Live System &amp; API Connectivity</CardTitle>
          <CardDescription>
            Real-time check via Axios &amp; TanStack Query against{' '}
            <code className="bg-[#F5F8F5] px-1.5 py-0.5 rounded text-[11px]">/api/health</code> and{' '}
            <code className="bg-[#F5F8F5] px-1.5 py-0.5 rounded text-[11px]">
              /api/v1/system/status
            </code>
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
        >
          Refresh Status
        </Button>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5]/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-[#17231F]">
              <Server className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />
              {health.service}
            </span>
            <Badge
              variant="success"
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />}
            >
              {system?.apiStatus ?? 'operational'}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-xs text-[#64736B]">
            <div>
              <dt>Environment</dt>
              <dd className="font-medium text-[#17231F]">{health.environment}</dd>
            </div>
            <div>
              <dt>Backend State</dt>
              <dd className="font-medium text-[#17231F]">
                {system?.features.milestone ?? '01-foundation'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt>Server Timestamp</dt>
              <dd className="font-mono text-[11px] text-[#17231F]">{health.timestamp}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5]/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-[#17231F]">
              <Database className="w-4 h-4 text-[#102A25]" aria-hidden="true" />
              MongoDB (Mongoose)
            </span>
            <Badge variant={dbConnected ? 'success' : 'warning'}>
              {health.database.status}
            </Badge>
          </div>
          <p className="text-xs text-[#64736B] leading-relaxed">
            {dbConnected
              ? 'Real MongoDB connection established via Mongoose.'
              : health.database.configured
                ? `Database is not connected (${health.database.lastError ?? 'check URI/server'}).`
                : 'MONGODB_URI is not configured in server/.env yet. API remains operational.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
