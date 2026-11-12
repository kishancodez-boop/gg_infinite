import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to load data',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="bg-white border border-[#DC2626]/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-[#17231F]">{title}</h3>
          <p className="text-xs text-[#64736B] mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

