import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'demo'
  | 'forest';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const badgeClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-[#F5F8F5] text-[#64736B] border-[#DCE6DF]',
  success: 'bg-[#16A36A]/12 text-[#102A25] border-[#16A36A]/30',
  warning: 'bg-[#F4B942]/20 text-[#17231F] border-[#D97706]/35',
  danger: 'bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/30',
  info: 'bg-[#2563EB]/10 text-[#1E40AF] border-[#2563EB]/25',
  demo: 'bg-[#F4B942]/25 text-[#102A25] border-[#D97706]/45 font-semibold',
  forest: 'bg-[#102A25] text-white border-[#102A25]',
};

export function Badge({
  variant = 'neutral',
  icon,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${badgeClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

