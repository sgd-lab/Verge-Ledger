import type { VergeSegment } from '../schemas/segment.js';
import type { SurveyObservation } from '../schemas/observation.js';
import type { IndicatorSpecies } from '../schemas/indicator.js';
import type { ExportOptions } from './types.js';
import { CSV_HEADERS } from './constants.js';
import { SCO_4_DISCLAIMER } from '../scoring/constants.js';
import { coarsenPosition } from '../geometry/coarsening.js';
import { latLngToOsGridRef1km } from '../geometry/os-grid.js';
import { calculateTriageScore } from '../scoring/engine.js';

/**
 * Escapes a single CSV field value according to RFC 4180 rules.
 * Values containing commas, double quotes, or line breaks are wrapped in double quotes.
 * Double quotes within values are escaped as double double quotes ("").
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string of verge segments.
 * Uses CRLF (\r\n) line endings, explicit header row, and safe double-quote escaping.
 * Excludes local photo blobs and camera EXIF location metadata.
 * If sensitive taxa are recorded, coordinates are coarsened to 2 decimal places (~1 km grid blur).
 */
export function exportToCsv(
  segments: VergeSegment[],
  observations: SurveyObservation[],
  indicators: IndicatorSpecies[],
  options: ExportOptions = {},
): string {
  const { coarsenSensitive = true, coarseningPrecision = 2, includeDemo = false } = options;

  // Build a lookup map of indicators for fast species info retrieval
  const indicatorMap = new Map<string, IndicatorSpecies>();
  for (const ind of indicators) {
    indicatorMap.set(ind.id, ind);
  }

  // Filter segments by isDemo
  const eligibleSegments = includeDemo ? segments : segments.filter((s) => !s.isDemo);

  // Group observations by segmentId (keep most recent if multiple)
  const obsMap = new Map<string, SurveyObservation>();
  for (const obs of observations) {
    const existing = obsMap.get(obs.segmentId);
    if (!existing || new Date(obs.observedAt).getTime() > new Date(existing.observedAt).getTime()) {
      obsMap.set(obs.segmentId, obs);
    }
  }

  const rows: string[] = [];

  // Header row
  rows.push(CSV_HEADERS.map((h) => escapeCsvField(h)).join(','));

  for (const seg of eligibleSegments) {
    const obs = obsMap.get(seg.id);

    // Compute or retrieve score
    let scoreResult = obs?.scoreResult;
    if (obs && !scoreResult) {
      try {
        const obsIndicators: IndicatorSpecies[] = [];
        for (const id of obs.indicatorIds) {
          const ind = indicatorMap.get(id);
          if (ind) {
            obsIndicators.push(ind);
          }
        }
        scoreResult = calculateTriageScore({
          forbCountBand: obs.forbCountBand,
          swardStructure: obs.swardStructure,
          cutState: obs.cutState,
          cuttingsState: obs.cuttingsState,
          lastCutMonth: obs.lastCutMonth,
          indicators: obsIndicators,
          nutrientDominantCount: obs.nutrientDominantIds.length,
        });
      } catch {
        scoreResult = undefined;
      }
    }

    // Determine sensitive taxa
    let hasSensitiveTaxa = false;
    const indicatorSpeciesNames: string[] = [];
    const nutrientDominantNames: string[] = [];

    if (obs) {
      for (const id of obs.indicatorIds) {
        const ind = indicatorMap.get(id);
        if (ind) {
          indicatorSpeciesNames.push(ind.commonName);
          if (ind.sensitive || ind.group === 'orchid') {
            hasSensitiveTaxa = true;
          }
        } else {
          indicatorSpeciesNames.push(id);
        }
      }

      for (const id of obs.nutrientDominantIds) {
        const ind = indicatorMap.get(id);
        nutrientDominantNames.push(ind ? ind.commonName : id);
      }
    }

    const shouldCoarsen = coarsenSensitive && hasSensitiveTaxa;

    // Get start and end coordinates [lon, lat]
    const coords = seg.geometry.coordinates;
    const rawStart = coords[0] ?? [0, 0];
    const rawEnd = coords[coords.length - 1] ?? rawStart;

    const startPt = shouldCoarsen ? coarsenPosition(rawStart, coarseningPrecision) : rawStart;
    const endPt = shouldCoarsen ? coarsenPosition(rawEnd, coarseningPrecision) : rawEnd;

    const startLon = startPt[0] ?? 0;
    const startLat = startPt[1] ?? 0;
    const endLon = endPt[0] ?? 0;
    const endLat = endPt[1] ?? 0;

    const osGridRef = latLngToOsGridRef1km(startLat, startLon);

    const rowValues = [
      seg.id, // segment_id
      seg.workspaceId, // workspace_id
      seg.roadName ?? '', // road_name
      seg.roadClass, // road_class
      seg.setting, // setting
      seg.widthBand, // verge_width_band
      seg.side, // side_of_road
      seg.lengthM, // length_metres
      startLat, // start_latitude
      startLon, // start_longitude
      endLat, // end_latitude
      endLon, // end_longitude
      osGridRef, // os_grid_reference_1km
      obs ? obs.observedAt : '', // survey_date
      obs ? obs.forbCountBand : '', // forb_count_band
      indicatorSpeciesNames.join('; '), // indicator_species
      nutrientDominantNames.join('; '), // nutrient_dominants
      obs ? obs.swardStructure : '', // sward_structure
      obs ? obs.cutState : '', // cut_state
      obs ? obs.cuttingsState : '', // cuttings_state
      obs?.lastCutMonth !== null && obs?.lastCutMonth !== undefined ? obs.lastCutMonth : '', // last_cut_month
      scoreResult ? scoreResult.finalScore : '', // triage_score
      scoreResult ? scoreResult.tierLabel : '', // tier
      scoreResult ? scoreResult.confidence : '', // confidence
      scoreResult ? scoreResult.flags.join('; ') : '', // management_flags
      hasSensitiveTaxa ? 'true' : 'false', // sensitive_taxa_recorded
      shouldCoarsen ? 'true' : 'false', // coordinates_coarsened
      obs?.notes ?? '', // notes
      seg.isDemo ? 'true' : 'false', // is_demo
      SCO_4_DISCLAIMER, // disclaimer
    ];

    rows.push(rowValues.map((v) => escapeCsvField(v)).join(','));
  }

  return rows.join('\r\n') + '\r\n';
}
