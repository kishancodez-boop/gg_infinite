import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronRight, Leaf, Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Badge, Button, Modal } from '../components/ui';
import { findNavItemByPath, NAVIGATION_ITEMS } from '../config/navigation';
import { useSystemHealth } from '../hooks/useSystemHealth';

const NAV_GROUPS: Array<'Intelligence' | 'Policy & Opportunities' | 'Operations'> = [
  'Intelligence',
  'Policy & Opportunities',
  'Operations',
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-[#16A36A] flex items-center justify-center shadow-xs">
            <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-white block leading-tight">
              GreenGrid India
            </span>
            <span className="text-xs text-[#DCE6DF]/75 block">Energy Intelligence</span>
          </div>
        </div>

        <nav aria-label="Primary Navigation" className="space-y-5">
          {NAV_GROUPS.map((group) => {
            const items = NAVIGATION_ITEMS.filter((item) => item.group === group);
            return (
              <div key={group} className="space-y-1.5">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#DCE6DF]/55">
                  {group}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4B942] ${
                            isActive
                              ? 'bg-[#16A36A] text-white shadow-xs'
                              : 'text-[#DCE6DF] hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span className="truncate">{item.label}</span>
                            </span>
                            {isActive && (
                              <ChevronRight
                                className="w-3.5 h-3.5 shrink-0 opacity-90"
                                aria-hidden="true"
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-5 border-t border-white/10 text-xs text-[#DCE6DF]/80 space-y-2">
        <div className="flex items-center gap-1.5 text-[#F4B942] font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Milestone 02: App Shell</span>
        </div>
        <p className="leading-relaxed">
          Source-attributed design system. Zero fabricated metrics or unverified claims.
        </p>
      </div>
    </div>
  );
}

export function MainLayout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const location = useLocation();
  const healthQuery = useSystemHealth();

  const currentNav = findNavItemByPath(location.pathname);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileDrawerOpen]);

  const apiBadgeVariant = healthQuery.isLoading
    ? 'neutral'
    : healthQuery.isError
      ? 'danger'
      : 'success';

  const apiBadgeText = healthQuery.isLoading
    ? 'Checking API...'
    : healthQuery.isError
      ? 'API Offline'
      : `API Online • DB: ${healthQuery.data?.database.status ?? 'unknown'}`;

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#17231F] flex flex-col lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-2 focus:rounded-lg focus:bg-[#102A25] focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 bg-[#102A25] border-r border-[#102A25] lg:sticky lg:top-0 lg:h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-[#102A25]/50 backdrop-blur-[1px]"
              aria-hidden="true"
            />
            <motion.aside
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-72 max-w-[85vw] bg-[#102A25] h-full overflow-y-auto shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#DCE6DF] hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              <SidebarContent onNavigate={() => setMobileDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#DCE6DF] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
              aria-controls="mobile-navigation-drawer"
              className="lg:hidden p-2 rounded-lg border border-[#DCE6DF] text-[#102A25] hover:bg-[#F5F8F5] cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#64736B] truncate">
                GreenGrid India &bull; {currentNav?.group ?? 'Platform'}
              </p>
              <p className="text-sm font-semibold text-[#17231F] truncate">
                {currentNav?.label ?? 'Page Not Found'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Badge variant={apiBadgeVariant} className="hidden sm:inline-flex">
              {apiBadgeText}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGuideOpen(true)}
              leftIcon={<BookOpen className="w-3.5 h-3.5" aria-hidden="true" />}
            >
              <span className="hidden sm:inline">Platform Guide</span>
              <span className="sm:hidden">Guide</span>
            </Button>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto"
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>

        <footer className="border-t border-[#DCE6DF] bg-white px-4 sm:px-6 py-3 text-xs text-[#64736B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>GreenGrid India &bull; Eco-Tech Renewable Energy Intelligence Platform</span>
          <span className="inline-flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthQuery.isError ? 'bg-[#DC2626]' : 'bg-[#16A36A]'
              }`}
              aria-hidden="true"
            />
            {apiBadgeText} &bull; Milestone 02 Design System
          </span>
        </footer>
      </div>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        variant="drawer"
        title="GreenGrid India — Design & Data Principles"
        description="Milestone 02 application shell and data integrity standards."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setGuideOpen(false)}>
            Close Guide
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-[#17231F] leading-relaxed">
          <div className="p-3.5 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF] space-y-1">
            <p className="font-semibold text-[#102A25]">1. Source-Attributed Intelligence</p>
            <p className="text-[#64736B]">
              Every metric, scheme, RPO record, finance item, and job listing must carry its official
              source URL, organization, retrieval timestamp, and verification status.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF] space-y-1">
            <p className="font-semibold text-[#102A25]">2. Zero Fabricated Statistics</p>
            <p className="text-[#64736B]">
              In Milestone 02, all 7 module routes render clean UI shells without inventing live
              renewable energy statistics or official government figures.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF] space-y-1">
            <p className="font-semibold text-[#102A25]">3. Accessible Eco-Tech System</p>
            <p className="text-[#64736B]">
              Built with keyboard navigation, visible focus rings, reduced-motion support, and
              responsive desktop/tablet/mobile layouts.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
