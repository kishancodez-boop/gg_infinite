import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  badge,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-dashed border-[#DCE6DF] rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-[#F5F8F5] border border-[#DCE6DF] flex items-center justify-center text-[#16A36A]">
        {icon}
      </div>
      {badge}
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-[#17231F]">{title}</h3>
        <p className="text-xs text-[#64736B] leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

