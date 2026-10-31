import type { FeatureCollection, Feature, LineString } from 'geojson';
import type { VergeSegment } from '../schemas/segment.js';
import type { SurveyObservation } from '../schemas/observation.js';
import type { IndicatorSpecies } from '../schemas/indicator.js';
import type { ExportOptions, VergeExportProperties } from './types.js';
import { SCO_4_DISCLAIMER } from '../scoring/constants.js';
import { coarsenLineString } from '../geometry/coarsening.js';
import { calculateTriageScore } from '../scoring/engine.js';
import { SCORING_VERSION } from '../scoring/constants.js';

/**
 * Generates an RFC 7946 compliant GeoJSON FeatureCollection of verge segments.
 * WGS84 coordinates ordered [longitude, latitude].
 * Photo blobs and camera EXIF location metadata are strictly excluded.
 * If sensitive taxa are recorded, coordinates are coarsened to 2 decimal places (~1 km grid blur).
 */
export function exportToGeoJson(
  segments: VergeSegment[],
  observations: SurveyObservation[],
  indicators: IndicatorSpecies[],
  options: ExportOptions = {},
): FeatureCollection<LineString, VergeExportProperties> {
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

  const features: Feature<LineString, VergeExportProperties>[] = [];

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
    const coordinates = shouldCoarsen
      ? coarsenLineString(seg.geometry.coordinates, coarseningPrecision)
      : seg.geometry.coordinates;

    const properties: VergeExportProperties = {
      segmentId: seg.id,
      workspaceId: seg.workspaceId,
      roadName: seg.roadName,
      roadClass: seg.roadClass,
      setting: seg.setting,
      widthBand: seg.widthBand,
      side: seg.side,
      lengthM: seg.lengthM,
      observedAt: obs ? obs.observedAt : null,
      forbCountBand: obs ? obs.forbCountBand : null,
      triageScore: scoreResult ? scoreResult.finalScore : null,
      tier: scoreResult ? scoreResult.tierLabel : null,
      confidence: scoreResult ? scoreResult.confidence : null,
      managementFlags: scoreResult ? scoreResult.flags : [],
      indicatorSpecies: indicatorSpeciesNames,
      nutrientDominants: nutrientDominantNames,
      hasSensitiveTaxa,
      isCoarsened: shouldCoarsen,
      swardStructure: obs ? obs.swardStructure : null,
      cutState: obs ? obs.cutState : null,
      cuttingsState: obs ? obs.cuttingsState : null,
      lastCutMonth: obs ? obs.lastCutMonth : null,
      notes: obs ? obs.notes : null,
      isDemo: seg.isDemo,
      scoringVersion: obs?.scoringVersion ?? SCORING_VERSION,
      disclaimer: SCO_4_DISCLAIMER,
    };

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties,
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
