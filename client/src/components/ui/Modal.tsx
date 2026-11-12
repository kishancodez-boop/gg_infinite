import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: 'modal' | 'drawer';
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  variant = 'modal',
  children,
  footer,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 z-50 flex ${
            variant === 'drawer' ? 'justify-end' : 'items-center justify-center p-4'
          }`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#102A25]/45 backdrop-blur-[1px]"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={
              variant === 'drawer'
                ? { x: '100%', opacity: 0.8 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            animate={
              variant === 'drawer' ? { x: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              variant === 'drawer'
                ? { x: '100%', opacity: 0.8 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative z-10 bg-white border border-[#DCE6DF] shadow-xl flex flex-col ${
              variant === 'drawer'
                ? 'w-full max-w-md h-full'
                : 'w-full max-w-lg rounded-2xl max-h-[85vh]'
            }`}
          >
            <div className="px-5 py-4 border-b border-[#DCE6DF] flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-[#17231F]">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-xs text-[#64736B] mt-0.5">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-[#64736B] hover:text-[#17231F] hover:bg-[#F5F8F5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">{children}</div>

            {footer && (
              <div className="px-5 py-3.5 border-t border-[#DCE6DF] bg-[#F5F8F5]/60 flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

