import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import {
  exportToCsv,
  exportToGeoJson,
  generateCutAdvice,
} from '@verge-ledger/core';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Alert } from '../components/ui/Alert';
import { useSurveyData } from '../hooks/useSurveyData';
import {
  downloadTextFile,
  evidencePackText,
  hasSensitiveTaxa,
  latestObservationsBySegment,
  monthName,
  scoreForObservation,
  segmentLabel,
} from '../lib/pageData';

export function ExportPage(): React.ReactElement {
  const { segments, observations } = useSurveyData();
  const latestBySegment = useMemo(() => latestObservationsBySegment(observations), [observations]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('all');
  const [includeDemo, setIncludeDemo] = useState(false);
  const [packText, setPackText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    const segment = selectedSegmentId === 'all' ? segments[0] : selectedSegments[0];
    if (!segment) {
      setPackText(null);
      setMessage('Record a segment first.');
      return;
    }
    const latest = latestBySegment.get(segment.id);
    const score = latest ? scoreForObservation(latest, INDICATOR_SPECIES) : null;
    let adviceText = 'No cut-timing advice: record a survey observation first.';
    if (latest && score) {
      try {
        const advice = generateCutAdvice({
          setting: segment.setting,
          roadClass: segment.roadClass,
          widthBand: segment.widthBand,
          tier: score.tier,
          cuttingsRemovable:
            latest.cuttingsState === 'removed'
              ? 'yes'
              : latest.cuttingsState === 'left'
                ? 'no'
                : 'unknown',
        });
        adviceText = [
          `Cut-timing advice (${advice.version}):`,
          `Primary: ${advice.primaryRegime.regimeId} — ${advice.primaryRegime.name} (${advice.primaryRegime.monthsDescription}; cut months: ${advice.primaryRegime.cuttingMonths.map((m) => monthName(m)).join(', ')}; cuttings: ${advice.primaryRegime.cuttingsHandling})`,
          `Fallback: ${advice.fallbackRegime.regimeId} — ${advice.fallbackRegime.name} (${advice.fallbackRegime.monthsDescription})`,
          `Safety: ${advice.safetyOverlay.description} ${advice.safetyOverlay.junctionsAndBendsNote}`,
          `Refuge: leave ${advice.refugeGuidance.refugePercentage} uncut in rotation.`,
        ].join('\n');
      } catch {
        adviceText = 'Cut-timing advice could not be calculated from this observation.';
      }
    }
    setPackText(`${evidencePackText(segment, latest, score, INDICATOR_SPECIES)}\n\n${adviceText}\n`);
    setMessage(
      selectedSegmentId === 'all'
        ? `Evidence pack generated below for ${segmentLabel(segment)} (the first segment). Select one segment to pack that segment specifically. Use your browser print function to print it.`
        : 'Evidence pack generated below. Use your browser print function to print it.',
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
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

      {segments.length === 0 ? (
        <Alert variant="info">
          No segments recorded yet. Record a survey first, then come back to export it.
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
              {anySensitive && (
                <p className="text-sm text-amber-900">
                  This selection includes sensitive taxa, so its coordinates will be blurred to a
                  1 km grid in the export.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
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

          <section aria-labelledby="segments-list-heading" className="space-y-4">
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

          {packText && (
            <section aria-labelledby="pack-heading" className="space-y-3">
              <h2 id="pack-heading" className="text-lg font-bold text-slate-900">
                Evidence pack
              </h2>
              <textarea
                aria-label="Evidence pack text"
                readOnly
                rows={28}
                className="w-full p-4 text-sm rounded-md bg-white border border-slate-300"
                value={packText}
              />
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                Print this page
              </Button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
