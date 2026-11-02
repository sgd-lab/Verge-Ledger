import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';

// Code-split every page route (RootLayout stays eager: it is the shell).
// Paths and components are unchanged; only the loading mechanism changed.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const SurveyPage = lazy(() =>
  import('./pages/SurveyPage').then((m) => ({ default: m.SurveyPage })),
);
const AdvisorPage = lazy(() =>
  import('./pages/AdvisorPage').then((m) => ({ default: m.AdvisorPage })),
);
const SimulatorPage = lazy(() =>
  import('./pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })),
);
const CouncilsPage = lazy(() =>
  import('./pages/CouncilsPage').then((m) => ({ default: m.CouncilsPage })),
);
const ExportPage = lazy(() =>
  import('./pages/ExportPage').then((m) => ({ default: m.ExportPage })),
);
const WorkspacesPage = lazy(() =>
  import('./pages/WorkspacesPage').then((m) => ({ default: m.WorkspacesPage })),
);
const ImpactPage = lazy(() =>
  import('./pages/ImpactPage').then((m) => ({ default: m.ImpactPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// On GitHub Pages the app lives under /Verge-Ledger/, so the router
// needs that basename there. Vite sets BASE_URL from the build base:
// '/' locally, '/Verge-Ledger/' for the Pages build.
const routerBasename =
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/'
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : undefined;

export function App(): React.ReactElement {
  return (
    <BrowserRouter basename={routerBasename}>
      <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading…</p>}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="survey" element={<SurveyPage />} />
            <Route path="advisor" element={<AdvisorPage />} />
            <Route path="simulator" element={<SimulatorPage />} />
            <Route path="councils" element={<CouncilsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="workspaces" element={<WorkspacesPage />} />
            <Route path="impact" element={<ImpactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
