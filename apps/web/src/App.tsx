import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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

// HashRouter, deliberately: GitHub Pages serves static files only, so
// a BrowserRouter deep link (/survey) would 404 on a direct visit or
// refresh unless the workflow is edited to add a 404.html fallback —
// and workflow files cannot be edited through this repo's GitHub App
// connection. With a hash, the route lives after '#', the server only
// ever sees index.html, and the existing Pages workflow deploys a
// working demo with no workflow change. Trade-off: URLs look like
// /#/survey instead of /survey. If the workflow is ever edited to add
// the 404 fallback, this can be reverted to BrowserRouter with a
// '/Verge-Ledger/' basename.
export function App(): React.ReactElement {
  return (
    <HashRouter>
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
    </HashRouter>
  );
}
