import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { SurveyPage } from './pages/SurveyPage';
import { AdvisorPage } from './pages/AdvisorPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { CouncilsPage } from './pages/CouncilsPage';
import { ExportPage } from './pages/ExportPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="survey" element={<SurveyPage />} />
          <Route path="advisor" element={<AdvisorPage />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="councils" element={<CouncilsPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
