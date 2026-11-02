import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { db } from '../db/schema';
import { useSurveyData } from '../hooks/useSurveyData';
import { latestObservationsBySegment, scoreForObservation } from '../lib/pageData';

function settingCount(setting: { value: unknown } | undefined): number {
  if (!setting) return 0;
  const value = typeof setting.value === 'string' ? Number(setting.value) : setting.value;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function ImpactPage(): React.ReactElement {
  const { workspaces, segments, observations, councilFacts, isLoading } = useSurveyData();
  const packsSetting = useLiveQuery(() => db.appSettings.get('packsGenerated'), []);
  const foiSetting = useLiveQuery(() => db.appSettings.get('foiGeneratedCount'), []);

  const counters = useMemo(() => {
    const realSegments = segments.filter((s) => !s.isDemo);
    const realObservations = observations.filter((o) => !o.isDemo);
    const kmSurveyed = realSegments.reduce((sum, s) => sum + s.lengthM, 0) / 1000;
    const scoredSegmentIds = new Set(
      realObservations
        .filter((o) => o.scoreResult !== null && o.scoreResult !== undefined)
        .map((o) => o.segmentId),
    );
    const latestBySegment = latestObservationsBySegment(realObservations);
    let flagged = 0;
    for (const segment of realSegments) {
      const latest = latestBySegment.get(segment.id);
      if (!latest) continue;
      const score = scoreForObservation(latest, INDICATOR_SPECIES);
      if (score?.tier === 'expert_review') flagged += 1;
    }
    const segmentsPerWorkspace = new Map<string, number>();
    for (const segment of realSegments) {
      segmentsPerWorkspace.set(
        segment.workspaceId,
        (segmentsPerWorkspace.get(segment.workspaceId) ?? 0) + 1,
      );
    }
    const activeWorkspaces = workspaces.filter(
      (w) => (segmentsPerWorkspace.get(w.id) ?? 0) >= 5,
    ).length;
    return {
      kmSurveyed,
      segmentsScored: scoredSegmentIds.size,
      segmentsFlagged: flagged,
      packsGenerated: settingCount(packsSetting),
      councilsWithSource: councilFacts.filter((f) => f.sourceUrl.trim() !== '').length,
      requestsGenerated: settingCount(foiSetting),
      activeWorkspaces,
    };
  }, [workspaces, segments, observations, councilFacts, packsSetting, foiSetting]);

  const rows: { label: string; value: string; definition: string }[] = [
    {
      label: 'Verge length surveyed',
      value: `${counters.kmSurveyed.toFixed(2)} km`,
      definition: 'Sum of the lengths of all non-demo segments, in kilometres.',
    },
    {
      label: 'Segments scored',
      value: String(counters.segmentsScored),
      definition: 'Non-demo segments with at least one saved observation score.',
    },
    {
      label: 'Segments flagged for expert review',
      value: String(counters.segmentsFlagged),
      definition: 'Non-demo segments whose latest score tier is “Refer for expert review”.',
    },
    {
      label: 'Evidence packs generated',
      value: String(counters.packsGenerated),
      definition:
        'Local counter “packsGenerated” in app settings, if present; 0 when no counter has been recorded.',
    },
    {
      label: 'Councils with a cited source',
      value: String(counters.councilsWithSource),
      definition: 'Council facts stored locally that have a non-empty source URL.',
    },
    {
      label: 'Information requests generated',
      value: String(counters.requestsGenerated),
      definition:
        'Local counter “foiGeneratedCount” in app settings, if present; 0 when no counter has been recorded.',
    },
    {
      label: 'Active workspaces',
      value: String(counters.activeWorkspaces),
      definition: 'Workspaces with at least 5 non-demo segments.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Impact</h1>
        <p className="text-sm text-slate-600 mt-1">
          Counts from the data stored on this device only. Demo data is excluded from every counter
          below.
        </p>
      </div>

      <Alert variant="info">
        No server connected — local-only mode. These counters are computed from local data only and
        are not shared anywhere.
      </Alert>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading local data…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((row) => (
            <Card key={row.label}>
              <CardHeader>
                <CardTitle>{row.label}</CardTitle>
                <CardDescription>{row.definition}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{row.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
