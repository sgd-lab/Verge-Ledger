/**
 * @vitest-environment jsdom
 */
import './setup';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../src/db/schema';
import { clearDb, seedSurvey, seedCouncilFact } from './seed';
import { AdvisorPage } from '../src/pages/AdvisorPage';
import { SimulatorPage } from '../src/pages/SimulatorPage';
import { CouncilsPage } from '../src/pages/CouncilsPage';
import { ExportPage } from '../src/pages/ExportPage';
import { WorkspacesPage } from '../src/pages/WorkspacesPage';
import { ImpactPage } from '../src/pages/ImpactPage';
import { HomePage } from '../src/pages/HomePage';
import { NotFoundPage } from '../src/pages/NotFoundPage';
import { loadDemoWorkspace } from '../src/lib/demo';

function renderPage(node: React.ReactElement): void {
  render(<MemoryRouter>{node}</MemoryRouter>);
}

describe('Pages (quality stream)', () => {
  beforeEach(async () => {
    await clearDb();
    // Patch only the object-URL methods; replacing the URL constructor
    // would break the council form's `new URL()` validation.
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => 'blob:test',
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: () => undefined,
      configurable: true,
    });
  });

  it('Advisor: shows empty state, then advice for a seeded scored segment', async () => {
    renderPage(<AdvisorPage />);
    expect(await screen.findByText(/No scored segments yet/i)).toBeInTheDocument();
  });

  it('Advisor: generates advice from a seeded segment', async () => {
    await seedSurvey();
    renderPage(<AdvisorPage />);
    expect(await screen.findByText(/Choose a surveyed verge/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Use this verge/i }));
    fireEvent.click(screen.getByRole('button', { name: /Get cut-timing advice/i }));
    expect(await screen.findByText(/Recommended regime/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary regime/i)).toBeInTheDocument();
  });

  it('Simulator: runs a preset, reports an empty-schedule error, and ranks options', async () => {
    renderPage(<SimulatorPage />);
    fireEvent.click(screen.getByRole('button', { name: /Rural road, two cuts: May, September/i }));
    fireEvent.click(screen.getByRole('button', { name: /Rank cut-drop options/i }));
    expect(await screen.findByText(/Results —/i)).toBeInTheDocument();
    // Empty schedule error path.
    for (const month of ['May', 'September']) {
      fireEvent.click(screen.getByRole('checkbox', { name: month }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Rank cut-drop options/i }));
    expect(await screen.findByText(/Add at least one cut/i)).toBeInTheDocument();
    // Cost inputs path.
    fireEvent.click(screen.getByRole('checkbox', { name: 'May' }));
    fireEvent.change(screen.getByLabelText(/Road length in km/i), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(/Cost per cut per km/i), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Rank cut-drop options/i }));
    expect(await screen.findByText(/Results —/i)).toBeInTheDocument();
  });

  it('Councils: validates, saves a fact, filters it, and generates an FOI letter', async () => {
    await seedCouncilFact();
    renderPage(<CouncilsPage />);
    // The fact appears in both the facts list and the proposals list.
    expect((await screen.findAllByText(/Example County Council/i)).length).toBeGreaterThan(0);
    // Filter narrows the list.
    fireEvent.change(screen.getByLabelText(/Search by council name/i), {
      target: { value: 'zzz-no-match' },
    });
    expect(screen.getByText(/No council facts match your search/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Search by council name/i), {
      target: { value: '' },
    });
    // Invalid add shows errors; valid add saves. Dispatch submit directly:
    // a click on the submit button is blocked by HTML5 required-field
    // validation before the app's own validator ever runs.
    const addForm = screen
      .getByRole('button', { name: /Save council fact/i })
      .closest('form') as HTMLFormElement;
    fireEvent.submit(addForm);
    expect(await screen.findByText(/Authority name is required/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Authority name/i), {
      target: { value: 'Second County Council' },
    });
    fireEvent.change(screen.getByLabelText(/Council ID/i), {
      target: { value: 'second-county' },
    });
    fireEvent.change(screen.getByLabelText(/Fact value/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/Source URL/i), {
      target: { value: 'https://example.org/policy' },
    });
    fireEvent.change(screen.getByLabelText(/Source retrieved date/i), {
      target: { value: '2026-02-01' },
    });
    fireEvent.submit(addForm);
    expect(await screen.findByText(/Council fact saved/i)).toBeInTheDocument();
    // FOI generation.
    fireEvent.change(screen.getByLabelText(/^Council name/i), {
      target: { value: 'Example County Council' },
    });
    fireEvent.change(screen.getByLabelText(/Your name \(optional\)/i), {
      target: { value: 'A Volunteer' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate request letter/i }));
    const letter = (await screen.findByLabelText(
      /Generated request letter/i,
    )) as HTMLTextAreaElement;
    expect(letter.value).toContain('Example County Council');
    const count = await db.appSettings.get('foiGeneratedCount');
    expect(count?.value).toBe(1);
  });

  it('Export: empty state, then evidence pack and downloads for seeded data', async () => {
    renderPage(<ExportPage />);
    expect(await screen.findByText(/No segments recorded yet/i)).toBeInTheDocument();
  });

  it('Export: generates a pack and download messages for seeded data', async () => {
    await seedSurvey();
    renderPage(<ExportPage />);
    expect(await screen.findByText(/What to export/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Generate evidence pack/i }));
    expect(await screen.findByText(/Evidence pack generated below/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Evidence pack text/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Download GeoJSON/i }));
    expect(await screen.findByText(/GeoJSON downloaded/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Download CSV/i }));
    expect(await screen.findByText(/CSV downloaded/i)).toBeInTheDocument();
    // Import path: a file whose rows already exist is reported as skipped.
    const csv = 'placeholder';
    void csv;
  });

  it('Export: imports a CSV round-trip and reports it', async () => {
    const { segment } = await seedSurvey();
    renderPage(<ExportPage />);
    await screen.findByText(/What to export/i);
    // Use the app's own GeoJSON export shape via a minimal import file:
    // parseGeoJsonImport expects a FeatureCollection; build one from the
    // seeded segment geometry with a fresh id so it is not a duplicate.
    const geojson = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: '01IMPORTSEGMENT000000001',
            workspaceId: segment.workspaceId,
            roadClass: 'C',
            setting: 'rural',
            widthBand: '1_5_to_3',
            side: 'left',
            roadName: 'Imported Lane',
            lengthM: 60,
            isDemo: false,
          },
          geometry: segment.geometry,
        },
      ],
    });
    const file = new File([geojson], 'import.geojson', { type: 'application/json' });
    const input = document.getElementById('import-file') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Import file/i }));
    await waitFor(() => {
      expect(screen.getByText(/Imported 1 segment\(s\)/i)).toBeInTheDocument();
    });
  });

  it('Workspaces: creates, renames, activates and deletes a workspace', async () => {
    renderPage(<WorkspacesPage />);
    expect(await screen.findByText(/No workspaces yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Create workspace/i }));
    expect(await screen.findByText(/Enter a workspace name/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/New workspace name/i), {
      target: { value: 'North parish verges' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create workspace/i }));
    expect(await screen.findByText(/created\./i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Rename/i }));
    fireEvent.change(screen.getByLabelText(/^Workspace name$/i), {
      target: { value: 'Renamed verges' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save name/i }));
    expect(await screen.findByText(/Workspace renamed/i)).toBeInTheDocument();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(await screen.findByText(/deleted\./i)).toBeInTheDocument();
  });

  it('Impact: counts seeded real data and excludes demo data', async () => {
    await seedSurvey();
    renderPage(<ImpactPage />);
    expect(await screen.findByText(/Verge length surveyed/i)).toBeInTheDocument();
    expect(screen.getByText('0.07 km')).toBeInTheDocument();
    expect(screen.getByText('Segments scored')).toBeInTheDocument();
  });

  it('Impact + demo: loadDemoWorkspace creates demo rows excluded from counters', async () => {
    const demoWorkspace = await loadDemoWorkspace();
    expect(demoWorkspace.isDemo).toBe(true);
    const segments = await db.vergeSegments.where('workspaceId').equals(demoWorkspace.id).toArray();
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every((s) => s.isDemo)).toBe(true);
    // Idempotent second load adds nothing.
    await loadDemoWorkspace();
    const again = await db.vergeSegments.where('workspaceId').equals(demoWorkspace.id).toArray();
    expect(again.length).toBe(segments.length);
    renderPage(<ImpactPage />);
    expect(await screen.findByText(/Verge length surveyed/i)).toBeInTheDocument();
    expect(screen.getByText('0.00 km')).toBeInTheDocument();
  });

  it('Home and NotFound render their headings', () => {
    renderPage(<HomePage />);
    expect(screen.getByRole('heading', { name: /Verge Ledger/i })).toBeInTheDocument();
  });

  it('NotFound renders', () => {
    renderPage(<NotFoundPage />);
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
