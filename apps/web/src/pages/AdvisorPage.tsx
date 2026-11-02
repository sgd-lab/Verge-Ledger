import React, { useEffect, useMemo, useState } from 'react';
import { Sprout } from 'lucide-react';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import {
  generateCutAdvice,
  type AdviceResult,
  type CuttingsRemovableInput,
  type RoadClass,
  type Setting,
  type VergeTierInput,
  type WidthBand,
} from '@verge-ledger/core';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { useSurveyData } from '../hooks/useSurveyData';
import {
  WIDTH_LABELS,
  advisorInputFor,
  latestObservationsBySegment,
  monthName,
  scoreForObservation,
  segmentLabel,
} from '../lib/pageData';

export function AdvisorPage(): React.ReactElement {
  const { segments, observations } = useSurveyData();
  const latestBySegment = useMemo(() => latestObservationsBySegment(observations), [observations]);
  const scoredSegments = useMemo(
    () =>
      segments.filter((segment) => {
        const latest = latestBySegment.get(segment.id);
        return latest !== undefined;
      }),
    [segments, latestBySegment],
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const selectedSegment =
    segments.find((s) => s.id === selectedSegmentId) ?? scoredSegments[0];
  const latest = selectedSegment ? latestBySegment.get(selectedSegment.id) : undefined;
  const score = latest ? scoreForObservation(latest, INDICATOR_SPECIES) : null;

  // Editable inputs, pre-filled from the selected segment + observation.
  const defaults = selectedSegment && latest ? advisorInputFor(selectedSegment, latest, score) : null;
  const [setting, setSetting] = useState<Setting>('rural');
  const [roadClass, setRoadClass] = useState<RoadClass>('U');
  const [widthBand, setWidthBand] = useState<WidthBand>('1_5_to_3');
  const [tier, setTier] = useState<VergeTierInput>('unknown');
  const [cuttingsRemovable, setCuttingsRemovable] = useState<CuttingsRemovableInput>('unknown');
  const [cutsPerYear, setCutsPerYear] = useState('');
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyDefaults = () => {
    if (!defaults) return;
    setSetting(defaults.setting);
    setRoadClass(defaults.roadClass);
    setWidthBand(defaults.widthBand);
    setTier(defaults.tier);
    setCuttingsRemovable(defaults.cuttingsRemovable);
    setCutsPerYear(
      defaults.cutsPossiblePerYear !== undefined ? String(defaults.cutsPossiblePerYear) : '',
    );
    setAdvice(null);
  };

  // Pre-fill automatically when the selected verge changes. Previously the
  // form stayed on its initial defaults until the user pressed "Use this
  // verge", so advice was easily generated for the wrong verge.
  useEffect(() => {
    if (defaults) {
      setSetting(defaults.setting);
      setRoadClass(defaults.roadClass);
      setWidthBand(defaults.widthBand);
      setTier(defaults.tier);
      setCuttingsRemovable(defaults.cuttingsRemovable);
      setCutsPerYear(
        defaults.cutsPossiblePerYear !== undefined ? String(defaults.cutsPossiblePerYear) : '',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegment?.id]);

  const handleRun = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const input = {
        setting,
        roadClass,
        widthBand,
        tier,
        cuttingsRemovable,
        ...(cutsPerYear ? { cutsPossiblePerYear: Number(cutsPerYear) } : {}),
      };
      setAdvice(generateCutAdvice(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate advice.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sprout className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <span>Cut-Timing Advisor (verge-advice-v1)</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Pick a surveyed verge, check the details, and get a mowing regime. Highway safety rules
          take priority over every recommendation here.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {scoredSegments.length === 0 ? (
        <Alert variant="info">
          No scored segments yet. Record a survey first — the Advisor needs a segment with an
          observation and a triage score.
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Choose a surveyed verge</CardTitle>
              <CardDescription>
                The form below is pre-filled from the verge and its latest observation when you
                press “Use this verge”.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                id="advisor-segment"
                label="Segment"
                value={selectedSegment?.id ?? ''}
                onChange={(e) => {
                  setSelectedSegmentId(e.target.value);
                  setAdvice(null);
                }}
                options={scoredSegments.map((segment) => ({
                  value: segment.id,
                  label: segmentLabel(segment),
                }))}
                required
              />
              {selectedSegment && latest && score && (
                <p className="text-sm">
                  Latest score: <strong>{score.finalScore}/100 — {score.tierLabel}</strong> ·
                  Observed {new Date(latest.observedAt).toLocaleDateString()}
                </p>
              )}
              <Button type="button" variant="secondary" onClick={applyDefaults} disabled={!defaults}>
                Use this verge
              </Button>
            </CardContent>
          </Card>

          <form
            onSubmit={handleRun}
            className="bg-white p-6 rounded-lg border border-slate-200 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="advisor-setting"
                label="Setting"
                value={setting}
                onChange={(e) => setSetting(e.target.value as Setting)}
                options={[
                  { value: 'rural', label: 'Rural' },
                  { value: 'urban', label: 'Urban' },
                ]}
                required
              />
              <Select
                id="advisor-road-class"
                label="Road class"
                value={roadClass}
                onChange={(e) => setRoadClass(e.target.value as RoadClass)}
                options={[
                  { value: 'A', label: 'A road' },
                  { value: 'B', label: 'B road' },
                  { value: 'C', label: 'C road' },
                  { value: 'U', label: 'Unclassified' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
                required
              />
              <Select
                id="advisor-width"
                label="Verge width"
                value={widthBand}
                onChange={(e) => setWidthBand(e.target.value as WidthBand)}
                options={Object.entries(WIDTH_LABELS).map(([value, label]) => ({ value, label }))}
                required
              />
              <Select
                id="advisor-tier"
                label="Triage tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as VergeTierInput)}
                options={[
                  { value: 'ordinary', label: 'Ordinary verge' },
                  { value: 'promising', label: 'Promising verge' },
                  { value: 'expert_review', label: 'Refer for expert review' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
                required
              />
              <Select
                id="advisor-cuttings"
                label="Can cuttings be removed?"
                value={cuttingsRemovable}
                onChange={(e) => setCuttingsRemovable(e.target.value as CuttingsRemovableInput)}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
                required
              />
              <Input
                id="advisor-cuts-per-year"
                label="Cuts possible per year (optional)"
                type="number"
                min={0}
                max={20}
                placeholder="Leave blank if unknown"
                value={cutsPerYear}
                onChange={(e) => setCutsPerYear(e.target.value)}
              />
            </div>
            <Button type="submit">Get cut-timing advice</Button>
          </form>

          {advice && (
            <section aria-labelledby="advice-heading" className="space-y-4">
              <h2 id="advice-heading" className="text-lg font-bold text-slate-900">
                Recommended regime
              </h2>
              <Alert variant="warning" title="Safety first">
                {advice.safetyDisclaimer}
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Primary regime', regime: advice.primaryRegime },
                  { title: 'Fallback regime', regime: advice.fallbackRegime },
                ].map(({ title, regime }) => (
                  <Card key={title}>
                    <CardHeader>
                      <CardTitle>
                        {title}: {regime.regimeId} — {regime.name}
                      </CardTitle>
                      <CardDescription>{regime.monthsDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        Cut months:{' '}
                        {regime.cuttingMonths.map((m) => monthName(m)).join(', ')}
                      </p>
                      <p>Cuttings: {regime.cuttingsHandling}</p>
                      <p>{regime.rationale}</p>
                      {regime.note && <p>{regime.note}</p>}
                      <p className="text-xs text-slate-600">
                        Sources: {regime.sourceCitations.join('; ')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Safety overlay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{advice.safetyOverlay.description}</p>
                  <p>{advice.safetyOverlay.junctionsAndBendsNote}</p>
                  <p>
                    <strong>{advice.safetyOverlay.mandatoryRule}</strong>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Refuge and cutter guidance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Refuge: leave {advice.refugeGuidance.refugePercentage} uncut in rotation —{' '}
                    {advice.refugeGuidance.description} Placement:{' '}
                    {advice.refugeGuidance.placement} Rotation:{' '}
                    {advice.refugeGuidance.rotationSchedule}
                  </p>
                  <p>
                    Cutter height: at least {advice.cutterHeightGuidance.minHeightCm} cm —{' '}
                    {advice.cutterHeightGuidance.description}
                  </p>
                  <ul className="list-disc pl-5">
                    {advice.cutterHeightGuidance.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              {advice.wideVergeGuidance?.isApplicable && advice.wideVergeGuidance.zones && (
                <Card>
                  <CardHeader>
                    <CardTitle>Wide-verge zones (over 3 m)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>{advice.wideVergeGuidance.zones.zone1Edge}</p>
                    <p>{advice.wideVergeGuidance.zones.zone2Middle}</p>
                    <p>{advice.wideVergeGuidance.zones.zone3Back}</p>
                  </CardContent>
                </Card>
              )}
              {advice.flags.length > 0 && (
                <p className="text-sm">
                  Flags: <strong>{advice.flags.join(', ')}</strong>
                </p>
              )}
              <p className="text-xs text-slate-600">
                This is volunteer triage guidance, not a wildlife-site assessment or legal advice.
                Agree any change with your highway authority.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
