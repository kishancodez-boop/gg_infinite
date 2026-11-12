import {
  Activity,
  Briefcase,
  Calculator,
  Database,
  FileText,
  Landmark,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  to: string;
  label: string;
  shortDescription: string;
  group: 'Intelligence' | 'Policy & Opportunities' | 'Operations';
  icon: LucideIcon;
  milestoneTag: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    to: '/',
    label: 'National Dashboard',
    shortDescription:
      'Consolidated national and state renewable-energy indicators with verified source attribution.',
    group: 'Intelligence',
    icon: LayoutDashboard,
    milestoneTag: 'Shell',
  },
  {
    to: '/calculator',
    label: 'Solar ROI Calculator',
    shortDescription:
      'Transparent rooftop solar sizing, cost, savings, and simple payback estimation workspace.',
    group: 'Intelligence',
    icon: Calculator,
    milestoneTag: 'Shell',
  },
  {
    to: '/policies',
    label: 'Policies & Schemes',
    shortDescription:
      'Searchable central and state renewable-energy policies, subsidies, and official links.',
    group: 'Policy & Opportunities',
    icon: FileText,
    milestoneTag: 'Shell',
  },
  {
    to: '/rpo',
    label: 'RPO Tracker',
    shortDescription:
      'Renewable Purchase Obligation targets, reported compliance, and official source references.',
    group: 'Policy & Opportunities',
    icon: Activity,
    milestoneTag: 'Shell',
  },
  {
    to: '/finance',
    label: 'Green Finance',
    shortDescription:
      'Green loans, incentives, and institutional financing programs with verified eligibility notes.',
    group: 'Policy & Opportunities',
    icon: Landmark,
    milestoneTag: 'Shell',
  },
  {
    to: '/jobs',
    label: 'Green Jobs',
    shortDescription:
      'Renewable-energy careers, required skills, and verified employer or portal links.',
    group: 'Policy & Opportunities',
    icon: Briefcase,
    milestoneTag: 'Shell',
  },
  {
    to: '/admin',
    label: 'Admin / REA',
    shortDescription:
      'Source registry, controlled REA ingestion dry-runs, audit logs, and human review queue.',
    group: 'Operations',
    icon: Database,
    milestoneTag: 'Shell',
  },
];

export function findNavItemByPath(pathname: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find((item) => item.to === pathname);
}

