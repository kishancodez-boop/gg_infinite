import { ChevronRight, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-3 pb-5 border-b border-[#DCE6DF]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#64736B]">
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-[#102A25] transition-colors rounded px-1 py-0.5"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.label} className="inline-flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-[#64736B]/70" aria-hidden="true" />
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-[#102A25] transition-colors rounded px-1 py-0.5"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[#17231F]" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231F]">
              {title}
            </h1>
            {badge}
          </div>
          <p className="text-sm text-[#64736B] leading-relaxed">{description}</p>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

