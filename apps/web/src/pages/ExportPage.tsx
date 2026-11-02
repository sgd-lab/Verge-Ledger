import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import {
  exportToCsv,
  exportToGeoJson,
} from '@verge-ledger/core';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Alert } from '../components/ui/Alert';
import { ensureWorkspace, useSurveyData } from '../hooks/useSurveyData';
import { segmentRepo } from '../db/repositories/SegmentRepository';
import { observationRepo } from '../db/repositories/ObservationRepository';
import {
  downloadTextFile,
  hasSensitiveTaxa,
  latestObservationsBySegment,
  scoreForObservation,
  segmentLabel,
} from '../lib/pageData';
import {
  buildEvidencePack,
  isDemoSelection,
  parseCsvImport,
  parseGeoJsonImport,
  type EvidencePackContent,
  type ImportRowError,
} from '../lib/importExport';

export function ExportPage(): React.ReactElement {
  const { workspaces, segments, observations, councilFacts } = useSurveyData();
  const latestBySegment = useMemo(() => latestObservationsBySegment(observations), [observations]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('all');
  const [includeDemo, setIncludeDemo] = useState(false);
  const [pack, setPack] = useState<EvidencePackContent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<ImportRowError[]>([]);

  const selectedSegments =
    selectedSegmentId === 'all'
      ? segments
      : segments.filter((s) => s.id === selectedSegmentId);
  const selectedObservations =
    selectedSegmentId === 'all'
      ? observations
      : observations.filter((o) => o.segmentId === selectedSegmentId);
  const anySensitive = selectedObservations.some((o) =>
    hasSensitiveTaxa(INDICATOR_SPECIES, o.indicatorIds),
  );
  const selectionIsDemo = isDemoSelection(workspaces, selectedSegments);

  const handleGeoJson = () => {
    const collection = exportToGeoJson(selectedSegments, selectedObservations, INDICATOR_SPECIES, {
      includeDemo,
    });
    downloadTextFile('verge-ledger-export.geojson', JSON.stringify(collection, null, 2), 'application/geo+json');
    setMessage(`GeoJSON downloaded (${collection.features.length} segment(s)).`);
  };

  const handleCsv = () => {
    const csv = exportToCsv(selectedSegments, selectedObservations, INDICATOR_SPECIES, {
      includeDemo,
    });
    downloadTextFile('verge-ledger-export.csv', csv, 'text/csv');
    setMessage('CSV downloaded.');
  };

  const handleEvidencePack = () => {
    if (selectedSegments.length === 0) {
      setPack(null);
      setMessage('Record a segment first.');
      return;
    }
    setPack(
      buildEvidencePack({
        segments: selectedSegments,
        observations: selectedObservations,
        indicators: INDICATOR_SPECIES,
        councilFacts,
        isDemo: selectionIsDemo,
        simulatorText: null,
      }),
    );
    setMessage(
      selectedSegmentId === 'all'
        ? `Evidence pack generated below for all ${selectedSegments.length} selected segment(s).`
        : 'Evidence pack generated below.',
    );
  };

  const handleImport = async () => {
    if (!importFile || importing) return;
    setImporting(true);
    setImportSummary(null);
    setImportErrors([]);
    try {
      const text = await importFile.text();
      const workspace = workspaces[0] ?? (await ensureWorkspace());
      const options = { fallbackWorkspaceId: workspace.id, indicators: INDICATOR_SPECIES };
      const parsed = importFile.name.toLowerCase().endsWith('.csv')
        ? parseCsvImport(text, options)
        : parseGeoJsonImport(text, options);
      const errors: ImportRowError[] = [...parsed.errors];
      let segmentsImported = 0;
      let observationsImported = 0;
      for (const segment of parsed.segments) {
        try {
          if (await segmentRepo.getById(segment.id)) {
            errors.push({ row: `Segment ${segment.id}`, message: 'Already stored locally; skipped.' });
            continue;
          }
          await segmentRepo.create(segment);
          segmentsImported += 1;
        } catch (err) {
          errors.push({
            row: `Segment ${segment.id}`,
            message: err instanceof Error ? err.message : 'Could not import this segment.',
          });
        }
      }
      for (const observation of parsed.observations) {
        try {
          if (await observationRepo.getById(observation.id)) {
            errors.push({ row: `Observation ${observation.id}`, message: 'Already stored locally; skipped.' });
            continue;
          }
          await observationRepo.create(observation);
          observationsImported += 1;
        } catch (err) {
          errors.push({
            row: `Observation ${observation.id}`,
            message: err instanceof Error ? err.message : 'Could not import this observation.',
          });
        }
      }
      setImportErrors(errors);
      setImportSummary(
        `Imported ${segmentsImported} segment(s) and ${observationsImported} observation(s). ${errors.length} row(s) failed or were skipped — see the list below.`,
      );
    } catch {
      setImportSummary('Could not read that file. Choose a GeoJSON or CSV file in the app export format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 no-print">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Download className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Evidence Pack & Data Export</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Export what you recorded locally. Nothing is sent anywhere by this page — files download
          to your device.
        </p>
      </div>

      <Alert variant="warning" title="Read before sharing">
        <p>
          The score is a volunteer triage, not a Local Wildlife Site assessment or legal advice.
        </p>
        <p>
          Sensitive taxa are never shown at precise location in a public export: segments with
          sensitive species are blurred to a 1 km grid in GeoJSON and CSV.
        </p>
      </Alert>

      {message && <Alert variant="success">{message}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Import workspace data</CardTitle>
          <CardDescription>
            Import a GeoJSON FeatureCollection or a CSV file in the app&apos;s own export format.
            Every row is validated against the segment and observation schemas; rows that fail
            are listed below with the reason and are not imported. Demo flags in the file are
            kept as they are.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 no-print">
          <label className="block text-sm font-semibold text-slate-800" htmlFor="import-file">
            File to import (.geojson, .json or .csv)
          </label>
          <input
            id="import-file"
            type="file"
            accept=".geojson,.json,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <Button type="button" onClick={handleImport} disabled={!importFile || importing}>
            {importing ? 'Importing…' : 'Import file'}
          </Button>
          {importSummary && <Alert variant="info">{importSummary}</Alert>}
          {importErrors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Rows that failed or were skipped</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {importErrors.map((err, index) => (
                  <li key={`${err.row}-${index}`}>
                    <strong>{err.row}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {segments.length === 0 ? (
        <Alert variant="info">
          No segments recorded yet. Record a survey first, or import a file above, then come back
          to export it.
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                What to export ({segments.length} segment(s), {observations.length} observation(s))
              </CardTitle>
              <CardDescription>
                Choose all segments or one segment. Demo segments are left out unless you tick the
                box below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                id="export-segment"
                label="Segment"
                value={selectedSegmentId}
                onChange={(e) => setSelectedSegmentId(e.target.value)}
                options={[
                  { value: 'all', label: 'All segments' },
                  ...segments.map((segment) => ({
                    value: segment.id,
                    label: segmentLabel(segment),
                  })),
                ]}
                required
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeDemo}
                  onChange={(e) => setIncludeDemo(e.target.checked)}
                />
                Include demo segments (normally excluded)
              </label>
              {includeDemo && (
                <Alert variant="warning">
                  Warning: demo segments are included in this export. Demo data is not real
                  survey data — label it as demo wherever you share it.
                </Alert>
              )}
              {selectionIsDemo && (
                <Alert variant="warning">
                  This selection is demo data (its workspace is demo, or every selected segment
                  is demo), so any evidence pack from it will carry a DEMO watermark and cannot
                  be exported as a real pack.
                </Alert>
              )}
              {anySensitive && (
                <p className="text-sm text-amber-900">
                  This selection includes sensitive taxa, so its coordinates will be blurred to a
                  1 km grid in the export.
                </p>
              )}
              <div className="flex flex-wrap gap-3 no-print">
                <Button type="button" onClick={handleGeoJson}>
                  Download GeoJSON
                </Button>
                <Button type="button" variant="secondary" onClick={handleCsv}>
                  Download CSV
                </Button>
                <Button type="button" variant="secondary" onClick={handleEvidencePack}>
                  Generate evidence pack
                </Button>
              </div>
            </CardContent>
          </Card>

          <section aria-labelledby="segments-list-heading" className="space-y-4 no-print">
            <h2 id="segments-list-heading" className="text-lg font-bold text-slate-900">
              Segments in this export
            </h2>
            {selectedSegments.map((segment) => {
              const latest = latestBySegment.get(segment.id);
              const score = latest ? scoreForObservation(latest, INDICATOR_SPECIES) : null;
              return (
                <Card key={segment.id}>
                  <CardHeader>
                    <CardTitle>{segmentLabel(segment)}</CardTitle>
                    <CardDescription>
                      {segment.setting} · Road class {segment.roadClass} ·{' '}
                      {latest ? `Latest score: ${score ? `${score.finalScore}/100 — ${score.tierLabel}` : 'not scored'}` : 'No observation yet'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </section>

          {pack && (
            <section aria-labelledby="pack-heading" className="space-y-3">
              <h2 id="pack-heading" className="text-lg font-bold text-slate-900">
                Evidence pack
              </h2>
              {pack.isDemo && (
                <Alert variant="error">
                  DEMO — NOT A REAL EVIDENCE PACK. This selection is demo data, so a real
                  (unwatermarked) pack cannot be exported from it. The downloads below are
                  watermarked demo packs only.
                </Alert>
              )}
              <textarea
                aria-label="Evidence pack text"
                readOnly
                rows={28}
                className="w-full p-4 text-sm rounded-md bg-white border border-slate-300"
                value={pack.plainText}
              />
              <div className="flex flex-wrap gap-3 no-print">
                <Button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      pack.isDemo ? 'verge-ledger-DEMO-evidence-pack.html' : 'verge-ledger-evidence-pack.html',
                      pack.html,
                      'text/html',
                    )
                  }
                >
                  {pack.isDemo ? 'Download DEMO evidence pack (HTML)' : 'Download evidence pack (HTML)'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    downloadTextFile(
                      pack.isDemo ? 'verge-ledger-DEMO-evidence-pack.md' : 'verge-ledger-evidence-pack.md',
                      pack.markdown,
                      'text/markdown',
                    )
                  }
                >
                  {pack.isDemo ? 'Download DEMO evidence pack (Markdown)' : 'Download evidence pack (Markdown)'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.print()}>
                  Print evidence pack (A4)
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
