import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sprout, Menu, X, ShieldAlert } from 'lucide-react';
import { db } from '../db/schema';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { cn } from '../lib/utils';

export function RootLayout(): React.ReactElement {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demoSetting = useLiveQuery(() => db.appSettings.get('demoActive'), []);
  const isDemo = demoSetting?.value === 'true';
  // The header previously hard-coded "Local Only" even if a workspace ever
  // enabled sync. Use the real (currently local-only) status instead.
  const syncStatus = useSyncStatus();

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/survey', label: 'Survey' },
    { to: '/advisor', label: 'Cut Advisor' },
    { to: '/simulator', label: 'Simulator' },
    { to: '/councils', label: 'Councils' },
    { to: '/export', label: 'Evidence & Export' },
    { to: '/workspaces', label: 'Workspaces' },
    { to: '/impact', label: 'Impact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 1. Skip to main content link for keyboard & screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-emerald-800 focus:text-white focus:font-semibold focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
      >
        Skip to main content
      </a>

      {/* 2. DEMO Mode Banner */}
      {isDemo && (
        <aside
          role="status"
          aria-label="Demonstration data active"
          className="bg-rose-100 border-b border-rose-300 text-rose-950 px-4 py-2 text-sm font-semibold flex items-center justify-between"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ShieldAlert className="h-4 w-4 text-rose-700 flex-shrink-0" aria-hidden="true" />
            <span>
              DEMO MODE ACTIVE — Using synthetic verge data. Excluded from council metrics.
            </span>
          </div>
        </aside>
      )}

      {/* 3. Header & Navigation */}
      <header role="banner" className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2.5 text-emerald-800 font-bold text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 rounded"
              >
                <div
                  className="bg-emerald-100 p-1.5 rounded-lg text-emerald-800"
                  aria-hidden="true"
                >
                  <Sprout className="h-6 w-6" />
                </div>
                <span>Verge Ledger</span>
              </Link>
              <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                v0.1.0
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'min-h-[44px] min-w-[44px] px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2',
                      isActive
                        ? 'text-emerald-900 bg-emerald-50 border-b-2 border-emerald-700 font-semibold'
                        : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Sync Status Badge & Mobile Menu Button */}
            <div className="flex items-center gap-2">
              <SyncStatusBadge
                state={syncStatus.state}
                lastSyncedAt={syncStatus.lastSyncedAt}
                className="hidden sm:inline-flex"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Mobile Navigation"
            className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block min-h-[44px] px-3 py-2.5 rounded-md text-base font-medium flex items-center',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2',
                    isActive
                      ? 'text-emerald-900 bg-emerald-50 font-semibold border-l-4 border-emerald-700 pl-2'
                      : 'text-slate-700 hover:bg-slate-100',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <SyncStatusBadge state={syncStatus.state} lastSyncedAt={syncStatus.lastSyncedAt} />
            </div>
          </nav>
        )}
      </header>

      {/* 4. Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* 5. Footer */}
      <footer
        role="contentinfo"
        className="bg-white border-t border-slate-200 mt-auto py-8 text-sm text-slate-600"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="font-semibold text-slate-800">Verge Ledger v0.1.0</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Open-source toolkit for parish councils and volunteers in England.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span>MIT License</span>
              <span>•</span>
              <span>Docs CC BY 4.0</span>
              <span>•</span>
              <span>WCAG 2.2 AA Target</span>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed text-center md:text-left">
            <p>
              Data citations: Plantlife <em>Good Verge Guide</em> & BSBI botanical records. Map
              tiles &copy; OpenStreetMap contributors.
            </p>
            <p className="mt-1 text-slate-600 font-medium">
              Highway Safety Warning: Always survey safely from footways or verges with clear
              sightlines. Wear high-visibility clothing. Never survey high-speed dual carriageways
              or motorways.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
