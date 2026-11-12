import { AlertCircle, CheckCircle2, Database, Loader2, RefreshCw, Server } from 'lucide-react';
import { useSystemHealth, useSystemStatus } from '../hooks/useSystemHealth';

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
      <div
        role="status"
        className="bg-white border border-[#DCE6DF] rounded-xl p-6 flex items-center gap-3 text-[#64736B]"
      >
        <Loader2 className="w-5 h-5 animate-spin text-[#16A36A]" aria-hidden="true" />
        <span className="text-sm font-medium">
          Checking Express API and MongoDB connection status...
        </span>
      </div>
    );
  }

  if (isError || !healthQuery.data) {
    return (
      <div
        role="alert"
        className="bg-white border border-[#DC2626]/30 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-[#17231F]">
              Backend API Unavailable
            </h3>
            <p className="text-sm text-[#64736B] mt-0.5">
              Could not reach <code className="text-xs bg-[#F5F8F5] px-1.5 py-0.5 rounded">/api/health</code>.
              Start the Express server on port 5000 and retry.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[#102A25] text-white hover:bg-[#16A36A] transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const health = healthQuery.data;
  const system = statusQuery.data;
  const dbConnected = health.database.connected;

  return (
    <section
      aria-label="Live System Connectivity"
      className="bg-white border border-[#DCE6DF] rounded-xl p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#17231F]">
            Live System &amp; API Connectivity
          </h3>
          <p className="text-xs text-[#64736B] mt-0.5">
            Fetched in real time via Axios &amp; TanStack Query from <code className="bg-[#F5F8F5] px-1 rounded">/api/health</code> and <code className="bg-[#F5F8F5] px-1 rounded">/api/v1/system/status</code>
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DCE6DF] text-[#17231F] hover:bg-[#F5F8F5] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Status Card */}
        <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5]/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-[#17231F]">
              <Server className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />
              {health.service}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#16A36A]/15 text-[#102A25]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" aria-hidden="true" />
              {system?.apiStatus ?? 'operational'}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs text-[#64736B] pt-1">
            <div>
              <dt>Environment</dt>
              <dd className="font-medium text-[#17231F]">{health.environment}</dd>
            </div>
            <div>
              <dt>Milestone</dt>
              <dd className="font-medium text-[#17231F]">{system?.features.milestone ?? '01-foundation'}</dd>
            </div>
            <div className="col-span-2">
              <dt>Server Timestamp</dt>
              <dd className="font-mono text-[11px] text-[#17231F]">{health.timestamp}</dd>
            </div>
          </dl>
        </div>

        {/* MongoDB Status Card */}
        <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5]/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-[#17231F]">
              <Database className="w-4 h-4 text-[#102A25]" aria-hidden="true" />
              MongoDB (Mongoose)
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                dbConnected
                  ? 'bg-[#16A36A]/15 text-[#102A25]'
                  : 'bg-[#F4B942]/25 text-[#17231F]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbConnected ? 'bg-[#16A36A]' : 'bg-[#D97706]'
                }`}
                aria-hidden="true"
              />
              {health.database.status}
            </span>
          </div>
          <p className="text-xs text-[#64736B] leading-relaxed">
            {dbConnected
              ? 'Real MongoDB connection established via Mongoose.'
              : health.database.configured
                ? `Database is not connected (${health.database.lastError ?? 'check URI/server'}).`
                : 'MONGODB_URI is not configured in server/.env yet. API remains operational in Milestone 01.'}
          </p>
        </div>
      </div>
    </section>
  );
}

