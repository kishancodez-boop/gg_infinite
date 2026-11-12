import { ArrowRight, Calculator, Database, FileText, SunMedium } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemStatusPanel } from '../components/SystemStatusPanel';

const plannedPillars = [
  {
    title: 'National Energy Dashboard',
    description:
      'Consolidated renewable capacity, generation mix, state comparisons, and verified source timestamps.',
    icon: SunMedium,
    to: '/',
    status: 'Upcoming Milestone',
  },
  {
    title: 'Policies & Schemes Explorer',
    description:
      'Searchable central and state renewable energy schemes with official links and verification dates.',
    icon: FileText,
    to: '/policies',
    status: 'Upcoming Milestone',
  },
  {
    title: 'Solar ROI Calculator',
    description:
      'Transparent rooftop solar capacity, savings, and simple payback estimator with explicit assumptions.',
    icon: Calculator,
    to: '/calculator',
    status: 'Upcoming Milestone',
  },
  {
    title: 'Controlled REA Ingestion',
    description:
      'Auditable source registry and human-reviewed data pipeline respecting robots rules and terms.',
    icon: Database,
    to: '/admin',
    status: 'Upcoming Milestone',
  },
];

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* Eco-Tech Intro Banner */}
      <section className="rounded-xl bg-[#102A25] text-white p-6 sm:p-8 border border-[#102A25]">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-[#F4B942]">
            Milestone 01 &bull; Project Foundation Ready
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            GreenGrid India — Renewable Energy Intelligence Platform
          </h1>
          <p className="text-sm sm:text-base text-[#DCE6DF] leading-relaxed">
            Reducing fragmentation across India&apos;s renewable energy data, central and state
            schemes, solar economics, RPO compliance, green finance, and clean energy careers with
            transparent source attribution.
          </p>
        </div>
      </section>

      {/* Live API & DB Health */}
      <SystemStatusPanel />

      {/* Planned Architecture Overview (Placeholders Only) */}
      <section aria-label="Planned Platform Modules" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#17231F]">
            Planned Core Modules
          </h2>
          <span className="text-xs text-[#64736B]">
            Placeholders active &mdash; modules implemented in subsequent milestones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plannedPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white border border-[#DCE6DF] rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-[#16A36A]/60 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#16A36A]" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F5F8F5] text-[#64736B] border border-[#DCE6DF]">
                      {pillar.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#17231F]">{pillar.title}</h3>
                  <p className="text-xs text-[#64736B] leading-relaxed">{pillar.description}</p>
                </div>
                <Link
                  to={pillar.to}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A36A] hover:text-[#102A25]"
                >
                  Open route shell
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

