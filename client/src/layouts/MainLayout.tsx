import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  Calculator,
  Database,
  FileText,
  Landmark,
  LayoutDashboard,
  Leaf,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Platform Overview', icon: LayoutDashboard },
  { to: '/policies', label: 'Policies & Schemes', icon: FileText, badge: 'Planned' },
  { to: '/calculator', label: 'Solar ROI Calculator', icon: Calculator, badge: 'Planned' },
  { to: '/rpo', label: 'RPO Tracker', icon: Activity, badge: 'Planned' },
  { to: '/finance', label: 'Green Finance', icon: Landmark, badge: 'Planned' },
  { to: '/jobs', label: 'Green Jobs', icon: Briefcase, badge: 'Planned' },
  { to: '/admin', label: 'REA & Admin', icon: Database, badge: 'Planned' },
];

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#17231F] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-[#102A25] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#16A36A] flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-semibold tracking-tight block leading-none">
              GreenGrid India
            </span>
            <span className="text-[11px] text-[#DCE6DF]/80">
              Energy Intelligence
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#16A36A]"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-68 bg-[#102A25] text-white flex-shrink-0 lg:min-h-screen flex flex-col justify-between`}
      >
        <div className="p-5">
          <div className="hidden lg:flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-[#16A36A] flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight leading-tight">
                GreenGrid India
              </h1>
              <p className="text-xs text-[#DCE6DF]/75">
                Renewable Intelligence
              </p>
            </div>
          </div>

          <nav aria-label="Primary Navigation" className="mt-4 lg:mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#16A36A] text-white'
                        : 'text-[#DCE6DF] hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-[#F4B942]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-white/10 text-xs text-[#DCE6DF]/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#F4B942] font-medium">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Milestone 01: Foundation</span>
          </div>
          <p className="leading-relaxed">
            Source-verified architecture. No fabricated statistics are displayed.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#DCE6DF] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#64736B]">
              India Renewable Energy Intelligence Platform
            </p>
            <h2 className="text-lg font-semibold text-[#17231F]">
              GreenGrid India Workspace
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F8F5] text-[#102A25] border border-[#DCE6DF]">
            <span className="w-2 h-2 rounded-full bg-[#F4B942]" aria-hidden="true" />
            Foundation Shell (No Live Metrics Yet)
          </span>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="border-t border-[#DCE6DF] bg-white px-6 py-3 text-xs text-[#64736B] flex flex-wrap items-center justify-between gap-2">
          <span>GreenGrid India &bull; Milestone 01 Technical Foundation</span>
          <span>Eco-Tech MERN Stack (React, Vite, Express, TypeScript, MongoDB)</span>
        </footer>
      </div>
    </div>
  );
}

