import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const styleMap: Record<ToastVariant, string> = {
  success: 'border-[#16A36A]/40 bg-white text-[#17231F]',
  info: 'border-[#2563EB]/35 bg-white text-[#17231F]',
  warning: 'border-[#D97706]/45 bg-white text-[#17231F]',
  error: 'border-[#DC2626]/40 bg-white text-[#17231F]',
};

const iconColorMap: Record<ToastVariant, string> = {
  success: 'text-[#16A36A]',
  info: 'text-[#2563EB]',
  warning: 'text-[#D97706]',
  error: 'text-[#DC2626]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = iconMap[toast.variant];
            return (
              <motion.div
                key={toast.id}
                role="status"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto rounded-xl border shadow-lg p-3.5 flex items-start gap-3 ${styleMap[toast.variant]}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 mt-0.5 ${iconColorMap[toast.variant]}`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{toast.title}</p>
                  {toast.description && (
                    <p className="text-xs text-[#64736B] mt-0.5 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded text-[#64736B] hover:text-[#17231F] hover:bg-[#F5F8F5] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

