import {
  MONTH_NAMES,
  calculateTriageScore,
  type AdvisorInput,
  type CuttingsRemovableInput,
  type IndicatorSpecies,
  type ScoreResult,
  type SurveyObservation,
  type VergeSegment,
} from '@verge-ledger/core';
import type { CouncilFactRecord } from '../db/schema';

/** Human-readable labels for the coded survey fields. */
export const FORB_BAND_LABELS: Record<string, string> = {
  '0': '0 forbs',
  '1_2': '1–2 forbs',
  '3_5': '3–5 forbs',
  '6_9': '6–9 forbs',
  '10_14': '10–14 forbs',
  '15plus': '15 or more forbs',
};

export const SWARD_LABELS: Record<string, string> = {
  short_uniform: 'Short and uniform',
  medium_mixed: 'Medium and mixed',
  tall_rank: 'Tall and rank',
};

export const WIDTH_LABELS: Record<string, string> = {
  lt1_5: 'Under 1.5 m',
  '1_5_to_3': '1.5–3 m',
  gt3: 'Over 3 m',
};

export function monthName(month: number): string {
  return MONTH_NAMES[month] ?? `Month ${month}`;
}

export function segmentLabel(segment: VergeSegment): string {
  const road = segment.roadName?.trim();
  const base = road ? road : `Road class ${segment.roadClass} verge`;
  return `${base} (${segment.lengthM} m, ${segment.side} side)`;
}

/** Most recent observation per segment, by observed date then creation date. */
export function latestObservationsBySegment(
  observations: SurveyObservation[],
): Map<string, SurveyObservation> {
  const latest = new Map<string, SurveyObservation>();
  for (const obs of observations) {
    if (obs.deletedAt) continue;
    const existing = latest.get(obs.segmentId);
    if (
      !existing ||
      obs.observedAt > existing.observedAt ||
      (obs.observedAt === existing.observedAt && obs.createdAt > existing.createdAt)
    ) {
      latest.set(obs.segmentId, obs);
    }
  }
  return latest;
}

export function indicatorById(
  indicators: IndicatorSpecies[],
  id: string,
): IndicatorSpecies | undefined {
  return indicators.find((item) => item.id === id);
}

export function indicatorNames(
  indicators: IndicatorSpecies[],
  ids: string[],
): string[] {
  return ids.map((id) => indicatorById(indicators, id)?.commonName ?? id);
}

export function hasSensitiveTaxa(
  indicators: IndicatorSpecies[],
  ids: string[],
): boolean {
  return ids.some((id) => {
    const item = indicatorById(indicators, id);
    return Boolean(item && (item.sensitive || item.group === 'orchid'));
  });
}

/**
 * Score for an observation: prefer the score stored when it was saved, and
 * otherwise recompute it from the stored fields and the indicator catalogue.
 * Returns null only when scoring itself fails, never a made-up number.
 */
export function scoreForObservation(
  observation: SurveyObservation,
  indicators: IndicatorSpecies[],
): ScoreResult | null {
  if (observation.scoreResult) return observation.scoreResult;
  try {
    return calculateTriageScore({
      forbCountBand: observation.forbCountBand,
      indicators: observation.indicatorIds
        .map((id) => indicatorById(indicators, id))
        .filter((item): item is IndicatorSpecies => item !== undefined),
      nutrientDominantCount: observation.nutrientDominantIds.length,
      swardStructure: observation.swardStructure,
      cutState: observation.cutState,
      cuttingsState: observation.cuttingsState,
      lastCutMonth: observation.lastCutMonth,
    });
  } catch {
    return null;
  }
}

/** Advisor inputs derived from a segment and its latest observation. */
export function advisorInputFor(
  segment: VergeSegment,
  observation: SurveyObservation,
  score: ScoreResult | null,
): AdvisorInput {
  const cuttingsRemovable: CuttingsRemovableInput =
    observation.cuttingsState === 'removed'
      ? 'yes'
      : observation.cuttingsState === 'left'
        ? 'no'
        : 'unknown';
  const input: AdvisorInput = {
    setting: segment.setting,
    roadClass: segment.roadClass,
    widthBand: segment.widthBand,
    tier: score ? score.tier : 'unknown',
    cuttingsRemovable,
  };
  if (observation.cutsPerYear !== null && observation.cutsPerYear !== undefined) {
    input.cutsPossiblePerYear = observation.cutsPerYear;
  }
  return input;
}

export interface CouncilFactForm {
  authorityName: string;
  councilId: string;
  tier: string;
  policyType: string;
  key: string;
  value: string;
  sourceUrl: string;
  sourceRetrievedAt: string;
  status: string;
}

/**
 * Validate a council-fact form. Every field the task requires is mandatory,
 * the source must be a real URL, and the retrieval date must be YYYY-MM-DD.
 * Unknown stays unknown: this never invents a value for a missing field.
 */
export function validateCouncilFactForm(form: CouncilFactForm): string[] {
  const errors: string[] = [];
  if (!form.authorityName.trim()) errors.push('Authority name is required.');
  if (!form.councilId.trim()) errors.push('Council ID is required.');
  if (!['county', 'unitary', 'district', 'parish'].includes(form.tier)) {
    errors.push('Choose a council tier.');
  }
  if (!['rural', 'urban', 'safety', 'designated'].includes(form.policyType)) {
    errors.push('Choose a policy type.');
  }
  if (!form.key.trim()) errors.push('Fact key is required.');
  if (!form.value.trim()) errors.push('Fact value is required.');
  try {
    const url = new URL(form.sourceUrl.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      errors.push('Source URL must start with http:// or https://.');
    }
  } catch {
    errors.push('Source URL must be a valid web address.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.sourceRetrievedAt.trim())) {
    errors.push('Source retrieved date must be YYYY-MM-DD.');
  } else {
    const parsed = new Date(`${form.sourceRetrievedAt.trim()}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      errors.push('Source retrieved date must be a real date.');
    }
  }
  if (!['unverified', 'verified'].includes(form.status)) {
    errors.push('Choose a status.');
  }
  return errors;
}

/** Convert a validated council-fact form into a Dexie record (id assigned by caller). */
export function councilFactRecordFromForm(
  form: CouncilFactForm,
  id: string,
): CouncilFactRecord {
  const numeric = Number(form.value.trim());
  const value: string | number | boolean =
    form.value.trim() === 'true'
      ? true
      : form.value.trim() === 'false'
        ? false
        : form.value.trim() !== '' && !Number.isNaN(numeric)
          ? numeric
          : form.value.trim();
  return {
    id,
    councilId: form.councilId.trim(),
    authorityName: form.authorityName.trim(),
    tier: form.tier as CouncilFactRecord['tier'],
    policyType: form.policyType as CouncilFactRecord['policyType'],
    lastVerifiedAt: form.sourceRetrievedAt.trim(),
    key: form.key.trim(),
    value,
    sourceUrl: form.sourceUrl.trim(),
    sourceRetrievedAt: form.sourceRetrievedAt.trim(),
    status: form.status as CouncilFactRecord['status'],
  };
}

/** Plain-English, printable evidence-pack summary for one segment. */
export function evidencePackText(
  segment: VergeSegment,
  observation: SurveyObservation | undefined,
  score: ScoreResult | null,
  indicators: IndicatorSpecies[],
): string {
  const lines: string[] = [
    'Verge Ledger — Evidence pack',
    '',
    `Verge: ${segmentLabel(segment)}`,
    `Road class: ${segment.roadClass} | Setting: ${segment.setting} | Width: ${WIDTH_LABELS[segment.widthBand] ?? segment.widthBand}`,
    `Length: ${segment.lengthM} m`,
    '',
  ];
  if (!observation || !score) {
    lines.push('No survey observation has been recorded for this verge yet.');
    lines.push('Record a survey first: the score and advice below cannot be calculated without one.');
  } else {
    lines.push(
      `Survey date: ${observation.observedAt}`,
      `Forbs: ${FORB_BAND_LABELS[observation.forbCountBand] ?? observation.forbCountBand}`,
      `Sward: ${SWARD_LABELS[observation.swardStructure] ?? observation.swardStructure}`,
      `Cut state: ${observation.cutState} | Cuttings: ${observation.cuttingsState}`,
      observation.lastCutMonth ? `Last cut month: ${monthName(observation.lastCutMonth)}` : 'Last cut month: unknown',
      `Indicator species: ${indicatorNames(indicators, observation.indicatorIds).join('; ') || 'none recorded'}`,
      `Nutrient dominants: ${indicatorNames(indicators, observation.nutrientDominantIds).join('; ') || 'none recorded'}`,
      '',
      `Triage score: ${score.finalScore} / 100 — ${score.tierLabel} (confidence: ${score.confidence})`,
      ...score.breakdown.map((line) => `- ${line}`),
      '',
      observation.notes ? `Notes: ${observation.notes}` : '',
    );
  }
  lines.push(
    '',
    'Score is a volunteer triage, not a Local Wildlife Site assessment or legal advice.',
    'Sensitive taxa are never shown at precise location in a public export.',
    'Survey from a safe position. Never stand on the carriageway. Highway safety rules take priority.',
  );
  return lines.filter((line) => line !== '').join('\n');
}

/** Trigger a browser download of a text file (used by the Export page). */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
