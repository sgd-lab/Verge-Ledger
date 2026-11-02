import {
  SCO_4_DISCLAIMER,
  SurveyObservationSchema,
  VergeSegmentSchema,
  generateCutAdvice,
  type IndicatorSpecies,
  type SurveyObservation,
  type VergeSegment,
  type Workspace,
} from '@verge-ledger/core';
import { generateUlid } from './id';
import {
  hasSensitiveTaxa,
  latestObservationsBySegment,
  monthName,
  scoreForObservation,
  segmentLabel,
} from './pageData';
import type { CouncilFactRecord } from '../db/schema';

/** One row that failed validation, with the reason shown to the user. */
export interface ImportRowError {
  row: string;
  message: string;
}

export interface ParsedImport {
  segments: VergeSegment[];
  observations: SurveyObservation[];
  errors: ImportRowError[];
}

export interface ImportOptions {
  /** Workspace id used when a row carries no usable workspace id. */
  fallbackWorkspaceId: string;
  /** Indicator catalogue, used to map exported common names back to ids. */
  indicators: IndicatorSpecies[];
}

const ULID_RE = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;
const NOW_FALLBACK = (): string => new Date().toISOString();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function zodIssues(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'record'}: ${issue.message}`)
    .join('; ');
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function booleanField(value: unknown): boolean {
  return value === true || value === 'true';
}

function ulidOrGenerated(value: unknown): string {
  const text = stringField(value);
  return text && ULID_RE.test(text) ? text : generateUlid();
}

function workspaceOrFallback(value: unknown, fallback: string): string {
  const text = stringField(value);
  return text && ULID_RE.test(text) ? text : fallback;
}

function dateTimeOrNow(value: unknown): string {
  const text = stringField(value);
  if (text) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return NOW_FALLBACK();
}

function numberField(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Map exported species names ("Common Knapweed; Bird's-foot Trefoil") back to
 * indicator ids. Unknown names are reported, never silently dropped into a
 * made-up id, and the caller skips the observation that named them.
 */
function mapSpeciesNames(
  raw: unknown,
  indicators: IndicatorSpecies[],
): { ids: string[]; unknownNames: string[] } {
  const ids: string[] = [];
  const unknownNames: string[] = [];
  if (typeof raw !== 'string' || raw.trim() === '') return { ids, unknownNames };
  const byName = new Map(indicators.map((item) => [item.commonName.toLowerCase(), item.id]));
  for (const part of raw.split(';')) {
    const name = part.trim();
    if (!name) continue;
    const id = byName.get(name.toLowerCase());
    if (id) {
      if (!ids.includes(id)) ids.push(id);
    } else {
      unknownNames.push(name);
    }
  }
  return { ids, unknownNames };
}

function buildObservationCandidate(
  fields: Record<string, unknown>,
  segmentId: string,
  options: ImportOptions,
): { observation: SurveyObservation | null; error: string | null } {
  const observedRaw = stringField(fields.observedAt ?? fields.survey_date);
  if (!observedRaw) return { observation: null, error: null };
  const observedAt =
    /^\d{4}-\d{2}-\d{2}$/.test(observedRaw) && !observedRaw.includes('T')
      ? `${observedRaw}T00:00:00.000Z`
      : observedRaw;
  const indicators = mapSpeciesNames(
    fields.indicatorSpecies ?? fields.indicatorIds,
    options.indicators,
  );
  const nutrients = mapSpeciesNames(
    fields.nutrientDominants ?? fields.nutrientDominantIds,
    options.indicators,
  );
  const unknownNames = [...indicators.unknownNames, ...nutrients.unknownNames];
  if (unknownNames.length > 0) {
    return {
      observation: null,
      error: `unknown indicator species name(s): ${unknownNames.join(', ')}`,
    };
  }
  // Indicator ids supplied directly (nested-observation format) pass through.
  const directIds = Array.isArray(fields.indicatorIds)
    ? fields.indicatorIds.filter((id): id is string => typeof id === 'string')
    : [];
  const directNutrients = Array.isArray(fields.nutrientDominantIds)
    ? fields.nutrientDominantIds.filter((id): id is string => typeof id === 'string')
    : [];
  const candidate = {
    id: ulidOrGenerated(fields.id),
    segmentId,
    observedAt,
    forbCountBand: fields.forbCountBand ?? fields.forb_count_band,
    indicatorIds: directIds.length > 0 ? directIds : indicators.ids,
    nutrientDominantIds: directNutrients.length > 0 ? directNutrients : nutrients.ids,
    swardStructure: fields.swardStructure ?? fields.sward_structure,
    cutState: fields.cutState ?? fields.cut_state,
    cuttingsState: fields.cuttingsState ?? fields.cuttings_state,
    // Pass an unparseable month through as-is so zod reports it, rather
    // than quietly turning it into "unknown".
    lastCutMonth: (() => {
      const raw = fields.lastCutMonth ?? fields.last_cut_month;
      if (raw === '' || raw === undefined || raw === null) return null;
      return numberField(raw) ?? raw;
    })(),
    cutsPerYear:
      fields.cutsPerYear === undefined || fields.cutsPerYear === null || fields.cutsPerYear === ''
        ? undefined
        : numberField(fields.cutsPerYear),
    notes:
      typeof fields.notes === 'string' && fields.notes.trim() !== '' ? fields.notes : null,
    photoIds: Array.isArray(fields.photoIds)
      ? fields.photoIds.filter((id): id is string => typeof id === 'string')
      : [],
    scoringVersion: 'verge-triage-v1' as const,
    createdAt: dateTimeOrNow(fields.createdAt),
    updatedAt: dateTimeOrNow(fields.updatedAt),
    deletedAt: null,
    isDemo: booleanField(fields.isDemo ?? fields.is_demo),
  };
  const parsed = SurveyObservationSchema.safeParse(candidate);
  if (!parsed.success) {
    return { observation: null, error: zodIssues(parsed.error) };
  }
  return { observation: parsed.data, error: null };
}

function buildSegmentCandidate(
  fields: Record<string, unknown>,
  geometry: unknown,
  options: ImportOptions,
): { segment: VergeSegment | null; error: string | null } {
  const candidate = {
    id: ulidOrGenerated(fields.segmentId ?? fields.id),
    workspaceId: workspaceOrFallback(
      fields.workspaceId ?? fields.workspace_id,
      options.fallbackWorkspaceId,
    ),
    geometry,
    lengthM: numberField(fields.lengthM ?? fields.length_metres),
    roadClass: fields.roadClass ?? fields.road_class,
    setting: fields.setting,
    widthBand: fields.widthBand ?? fields.verge_width_band,
    side: fields.side ?? fields.side_of_road,
    roadName:
      typeof fields.roadName === 'string' || typeof fields.road_name === 'string'
        ? (stringField(fields.roadName ?? fields.road_name) ?? null)
        : null,
    createdAt: dateTimeOrNow(fields.createdAt),
    updatedAt: dateTimeOrNow(fields.updatedAt),
    deletedAt: null,
    isDemo: booleanField(fields.isDemo ?? fields.is_demo),
  };
  const parsed = VergeSegmentSchema.safeParse(candidate);
  if (!parsed.success) {
    return { segment: null, error: zodIssues(parsed.error) };
  }
  return { segment: parsed.data, error: null };
}

/**
 * Parse a GeoJSON FeatureCollection of verge segments. Each feature's
 * properties may use the exported property names (segmentId, roadName, …)
 * or the raw segment field names, and may carry a nested `observation`
 * object or the flat exported observation fields (observedAt, …).
 * Invalid rows are reported and skipped; valid rows are returned.
 */
export function parseGeoJsonImport(text: string, options: ImportOptions): ParsedImport {
  const result: ParsedImport = { segments: [], observations: [], errors: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    result.errors.push({ row: 'File', message: 'Not valid JSON.' });
    return result;
  }
  if (!isRecord(parsed) || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
    result.errors.push({
      row: 'File',
      message: 'Expected a GeoJSON FeatureCollection with a features array.',
    });
    return result;
  }
  parsed.features.forEach((feature, index) => {
    const row = `GeoJSON feature ${index + 1}`;
    if (!isRecord(feature) || !isRecord(feature.properties)) {
      result.errors.push({ row, message: 'Feature has no properties object.' });
      return;
    }
    const { segment, error } = buildSegmentCandidate(
      feature.properties,
      feature.geometry,
      options,
    );
    if (!segment || error) {
      result.errors.push({ row, message: error ?? 'Segment failed validation.' });
      return;
    }
    result.segments.push(segment);
    const nested = isRecord(feature.properties.observation)
      ? feature.properties.observation
      : feature.properties;
    const hasObservation =
      isRecord(feature.properties.observation) || stringField(feature.properties.observedAt);
    if (!hasObservation) return;
    const { observation, error: obsError } = buildObservationCandidate(
      nested,
      segment.id,
      options,
    );
    if (observation) {
      result.observations.push(observation);
    } else if (obsError) {
      result.errors.push({ row: `${row} observation`, message: obsError });
    }
  });
  return result;
}

/** Minimal RFC 4180 CSV parser: quoted fields, doubled quotes, CRLF. */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0]?.trim() === ''));
}

/**
 * Parse CSV rows in the app's own export format (see core CSV_HEADERS).
 * Each row is one segment plus its latest observation when survey_date is
 * present. Coordinates come from the start/end columns as a two-point line.
 */
export function parseCsvImport(text: string, options: ImportOptions): ParsedImport {
  const result: ParsedImport = { segments: [], observations: [], errors: [] };
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    result.errors.push({ row: 'File', message: 'CSV file is empty.' });
    return result;
  }
  const headers = (rows[0] ?? []).map((h) => h.trim());
  if (!headers.includes('segment_id')) {
    result.errors.push({
      row: 'File',
      message: 'CSV header must include segment_id (use the app export format).',
    });
    return result;
  }
  rows.slice(1).forEach((values, index) => {
    const rowLabel = `CSV row ${index + 2}`;
    const fields: Record<string, unknown> = {};
    headers.forEach((header, col) => {
      fields[header] = values[col] ?? '';
    });
    const startLat = numberField(fields.start_latitude);
    const startLon = numberField(fields.start_longitude);
    const endLat = numberField(fields.end_latitude);
    const endLon = numberField(fields.end_longitude);
    const geometry =
      startLat !== undefined && startLon !== undefined && endLat !== undefined && endLon !== undefined
        ? { type: 'LineString' as const, coordinates: [[startLon, startLat], [endLon, endLat]] }
        : undefined;
    const { segment, error } = buildSegmentCandidate(fields, geometry, options);
    if (!segment || error) {
      result.errors.push({ row: rowLabel, message: error ?? 'Segment failed validation.' });
      return;
    }
    result.segments.push(segment);
    if (stringField(fields.survey_date)) {
      const { observation, error: obsError } = buildObservationCandidate(
        {
          ...fields,
          observedAt: fields.survey_date,
          indicatorSpecies: fields.indicator_species,
          nutrientDominants: fields.nutrient_dominants,
        },
        segment.id,
        options,
      );
      if (observation) {
        result.observations.push(observation);
      } else if (obsError) {
        result.errors.push({ row: `${rowLabel} observation`, message: obsError });
      }
    }
  });
  return result;
}

/**
 * A selection counts as demo when any selected segment's workspace is demo,
 * or when every selected segment is itself demo (the seeded-demo contract).
 */
export function isDemoSelection(workspaces: Workspace[], segments: VergeSegment[]): boolean {
  if (segments.length === 0) return false;
  const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
  if (segments.some((s) => workspaceById.get(s.workspaceId)?.isDemo)) return true;
  return segments.every((s) => s.isDemo);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function formatCoord(value: number, coarsened: boolean): string {
  return coarsened ? value.toFixed(2) : String(value);
}

interface PackSegmentRow {
  label: string;
  tier: string;
  score: string;
  coords: string;
  sensitive: boolean;
  advice: string;
}

export interface EvidencePackInput {
  segments: VergeSegment[];
  observations: SurveyObservation[];
  indicators: IndicatorSpecies[];
  councilFacts: CouncilFactRecord[];
  isDemo: boolean;
  /** Optional simulator summary text, when a simulator run is included. */
  simulatorText?: string | null;
  generatedAt?: string;
}

export interface EvidencePackContent {
  plainText: string;
  markdown: string;
  html: string;
  isDemo: boolean;
}

/** Build the evidence pack (summary, coordinates, tiers, advice, simulator, council facts, method, disclaimer, contact) in text, Markdown and HTML. */
export function buildEvidencePack(input: EvidencePackInput): EvidencePackContent {
  const latestBySegment = latestObservationsBySegment(input.observations);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const rows: PackSegmentRow[] = input.segments.map((segment) => {
    const latest = latestBySegment.get(segment.id);
    const score = latest ? scoreForObservation(latest, input.indicators) : null;
    const sensitive = latest
      ? hasSensitiveTaxa(input.indicators, latest.indicatorIds)
      : false;
    const coords = segment.geometry.coordinates
      .map(([lon, lat]) => `[${formatCoord(lon, sensitive)}, ${formatCoord(lat, sensitive)}]`)
      .join(' → ');
    let advice = 'No cut-timing advice: record a survey observation first.';
    if (latest && score) {
      try {
        const adviceResult = generateCutAdvice({
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
        advice = [
          `Primary: ${adviceResult.primaryRegime.regimeId} — ${adviceResult.primaryRegime.name} (${adviceResult.primaryRegime.monthsDescription}; cut months: ${adviceResult.primaryRegime.cuttingMonths.map((m) => monthName(m)).join(', ')}; cuttings: ${adviceResult.primaryRegime.cuttingsHandling})`,
          `Fallback: ${adviceResult.fallbackRegime.regimeId} — ${adviceResult.fallbackRegime.name} (${adviceResult.fallbackRegime.monthsDescription})`,
          `Safety: ${adviceResult.safetyOverlay.description} ${adviceResult.safetyOverlay.junctionsAndBendsNote}`,
          `Refuge: leave ${adviceResult.refugeGuidance.refugePercentage} uncut in rotation.`,
        ].join('\n');
      } catch {
        advice = 'Cut-timing advice could not be calculated from this observation.';
      }
    }
    return {
      label: segmentLabel(segment),
      tier: score ? `${score.finalScore}/100 — ${score.tierLabel}` : 'No observation yet',
      score: score ? String(score.finalScore) : '—',
      coords,
      sensitive,
      advice,
    };
  });

  const demoBanner = input.isDemo
    ? 'DEMO — This pack is built from demonstration data and is NOT a real evidence pack.'
    : null;
  const councilLines =
    input.councilFacts.length === 0
      ? ['No council facts stored locally yet. Unknown stays unknown.']
      : input.councilFacts.map(
          (fact) =>
            `${fact.authorityName} (${fact.tier}, ${fact.policyType}, ${fact.status}): ${fact.key} = ${String(fact.value)} — Source: ${fact.sourceUrl} (retrieved ${fact.sourceRetrievedAt})`,
        );
  const simulatorText =
    input.simulatorText ??
    'No simulator output included in this pack. Run the Simulator page separately if a cut-drop scenario is needed.';
  const contactLine =
    'Contact: Verge Ledger stores no contact details. Add your contact details here before sharing this pack.';

  const plainLines: string[] = [
    'Verge Ledger — Evidence pack',
    ...(demoBanner ? ['', demoBanner] : []),
    '',
    `Generated: ${generatedAt}`,
    `Summary: ${input.segments.length} segment(s), ${input.observations.length} observation(s).`,
    '',
    'Coordinates (longitude, latitude; blurred to 2 decimal places where sensitive taxa were recorded):',
    ...rows.map((r) => `- ${r.label}: ${r.coords}${r.sensitive ? ' (blurred — sensitive taxa recorded)' : ''}`),
    '',
    'Segments and tiers:',
    ...rows.map((r) => `- ${r.label}: ${r.tier}`),
    '',
    'Cut-timing advice:',
    ...rows.flatMap((r) => [`${r.label}:`, ...r.advice.split('\n')]),
    '',
    'Simulator output:',
    simulatorText,
    '',
    'Council facts (with sources):',
    ...councilLines,
    '',
    'Method: volunteer triage scoring (verge-triage-v1) and cut-timing advice from the latest survey observation per segment. The score is a volunteer triage, not a Local Wildlife Site assessment or legal advice.',
    `Disclaimer (SCO-4): ${SCO_4_DISCLAIMER}`,
    '',
    'Safety: survey from a safe position. Avoid fast roads. Never stand on the carriageway. Highway safety rules take priority over any recommendation. Never cut, pull up, sow or damage a verge without written permission from the highway authority or landowner. Do not trespass.',
    '',
    contactLine,
  ];

  const mdLines: string[] = [
    '# Verge Ledger — Evidence pack',
    ...(demoBanner ? ['', `> **${demoBanner}**`] : []),
    '',
    `Generated: ${generatedAt}`,
    '',
    `Summary: ${input.segments.length} segment(s), ${input.observations.length} observation(s).`,
    '',
    '## Coordinates',
    '',
    'Longitude, latitude. Coordinates are blurred to 2 decimal places where sensitive taxa were recorded.',
    '',
    '| Verge | Coordinates |',
    '| --- | --- |',
    ...rows.map(
      (r) =>
        `| ${escapeMarkdownCell(r.label)} | ${escapeMarkdownCell(r.coords)}${r.sensitive ? ' (blurred — sensitive taxa recorded)' : ''} |`,
    ),
    '',
    '## Segments and tiers',
    '',
    '| Verge | Tier |',
    '| --- | --- |',
    ...rows.map((r) => `| ${escapeMarkdownCell(r.label)} | ${escapeMarkdownCell(r.tier)} |`),
    '',
    '## Cut-timing advice',
    '',
    ...rows.flatMap((r) => [`### ${r.label}`, '', r.advice, '']),
    '## Simulator output',
    '',
    simulatorText,
    '',
    '## Council facts (with sources)',
    '',
    ...councilLines.map((line) => `- ${line}`),
    '',
    '## Method and disclaimer',
    '',
    'Method: volunteer triage scoring (verge-triage-v1) and cut-timing advice from the latest survey observation per segment. The score is a volunteer triage, not a Local Wildlife Site assessment or legal advice.',
    '',
    `Disclaimer (SCO-4): ${SCO_4_DISCLAIMER}`,
    '',
    'Safety: survey from a safe position. Avoid fast roads. Never stand on the carriageway. Highway safety rules take priority over any recommendation. Never cut, pull up, sow or damage a verge without written permission from the highway authority or landowner. Do not trespass.',
    '',
    contactLine,
  ];

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8">',
    '<title>Verge Ledger — Evidence pack</title>',
    '<style>body{font-family:system-ui,sans-serif;margin:2cm;color:#111}table{border-collapse:collapse}th,td{border:1px solid #999;padding:6px;text-align:left}.watermark{border:3px solid #b91c1c;color:#b91c1c;padding:12px;font-weight:bold;text-align:center}h1{font-size:22pt}h2{font-size:15pt}@media print{body{margin:1.5cm}@page{size:A4;margin:1.5cm}}</style>',
    '</head><body>',
    ...(demoBanner
      ? [`<div class="watermark" role="alert">DEMO — NOT A REAL EVIDENCE PACK</div>`]
      : []),
    '<h1>Verge Ledger — Evidence pack</h1>',
    `<p>Generated: ${escapeHtml(generatedAt)}</p>`,
    `<p>Summary: ${input.segments.length} segment(s), ${input.observations.length} observation(s).</p>`,
    '<h2>Coordinates</h2>',
    '<p>Longitude, latitude. Coordinates are blurred to 2 decimal places where sensitive taxa were recorded.</p>',
    '<table><thead><tr><th>Verge</th><th>Coordinates</th></tr></thead><tbody>',
    ...rows.map(
      (r) =>
        `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.coords)}${r.sensitive ? ' (blurred — sensitive taxa recorded)' : ''}</td></tr>`,
    ),
    '</tbody></table>',
    '<h2>Segments and tiers</h2>',
    '<table><thead><tr><th>Verge</th><th>Tier</th></tr></thead><tbody>',
    ...rows.map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.tier)}</td></tr>`),
    '</tbody></table>',
    '<h2>Cut-timing advice</h2>',
    ...rows.flatMap((r) => [
      `<h3>${escapeHtml(r.label)}</h3>`,
      `<p>${escapeHtml(r.advice).replace(/\n/g, '<br>')}</p>`,
    ]),
    '<h2>Simulator output</h2>',
    `<p>${escapeHtml(simulatorText).replace(/\n/g, '<br>')}</p>`,
    '<h2>Council facts (with sources)</h2>',
    '<ul>',
    ...councilLines.map((line) => `<li>${escapeHtml(line)}</li>`),
    '</ul>',
    '<h2>Method and disclaimer</h2>',
    '<p>Method: volunteer triage scoring (verge-triage-v1) and cut-timing advice from the latest survey observation per segment. The score is a volunteer triage, not a Local Wildlife Site assessment or legal advice.</p>',
    `<p>Disclaimer (SCO-4): ${escapeHtml(SCO_4_DISCLAIMER)}</p>`,
    '<p>Safety: survey from a safe position. Avoid fast roads. Never stand on the carriageway. Highway safety rules take priority over any recommendation. Never cut, pull up, sow or damage a verge without written permission from the highway authority or landowner. Do not trespass.</p>',
    `<p>${escapeHtml(contactLine)}</p>`,
    '</body></html>',
  ].join('\n');

  return {
    plainText: plainLines.join('\n'),
    markdown: mdLines.join('\n'),
    html,
    isDemo: input.isDemo,
  };
}
