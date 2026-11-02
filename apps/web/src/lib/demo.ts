import { INDICATOR_SPECIES } from '@verge-ledger/data';
import { calculateTriageScore, type Workspace } from '@verge-ledger/core';
import { db } from '../db/schema';
import { workspaceRepo } from '../db/repositories/WorkspaceRepository';
import { segmentRepo } from '../db/repositories/SegmentRepository';
import { observationRepo } from '../db/repositories/ObservationRepository';
import { indicatorById } from './pageData';

/**
 * Synthetic demo workspace (DEM-1). Every segment and observation is flagged
 * isDemo, uses clearly synthetic road names, and is excluded from impact
 * counters and real evidence packs by the existing export/counter rules.
 * Shaped like the scoring golden fixtures A-E in docs/03-method-and-rules
 * section 9: A ordinary, B refer, C refer, D ordinary, E promising.
 * Idempotent: re-running only creates segments whose road name is missing.
 */

interface DemoFixture {
  roadName: string;
  lengthM: number;
  roadClass: 'U';
  setting: 'rural';
  widthBand: '1_5_to_3';
  side: 'both';
  lon: number;
  lat: number;
  forbCountBand: '0' | '6_9' | '10_14' | '3_5';
  indicatorIds: string[];
  nutrientDominantIds: string[];
  swardStructure: 'short_uniform' | 'medium_mixed' | 'tall_rank';
  cutState: 'uncut' | 'unknown';
  cuttingsState: 'na' | 'left';
  lastCutMonth: number | null;
}

const FIXTURES: DemoFixture[] = [
  {
    roadName: 'Demo Road A',
    lengthM: 120,
    roadClass: 'U',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'both',
    lon: -1.5,
    lat: 52.5,
    forbCountBand: '0',
    indicatorIds: [],
    nutrientDominantIds: [],
    swardStructure: 'short_uniform',
    cutState: 'unknown',
    cuttingsState: 'na',
    lastCutMonth: null,
  },
  {
    roadName: 'Demo Road B',
    lengthM: 150,
    roadClass: 'U',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'both',
    lon: -1.498,
    lat: 52.502,
    forbCountBand: '6_9',
    indicatorIds: ['centaurea-nigra', 'galium-verum'],
    nutrientDominantIds: [],
    swardStructure: 'medium_mixed',
    cutState: 'unknown',
    cuttingsState: 'na',
    lastCutMonth: null,
  },
  {
    roadName: 'Demo Road C',
    lengthM: 180,
    roadClass: 'U',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'both',
    lon: -1.496,
    lat: 52.504,
    forbCountBand: '10_14',
    indicatorIds: ['centaurea-nigra', 'rhinanthus-minor', 'lotus-corniculatus'],
    nutrientDominantIds: ['urtica-dioica', 'rumex-obtusifolius'],
    swardStructure: 'medium_mixed',
    cutState: 'unknown',
    cuttingsState: 'na',
    lastCutMonth: null,
  },
  {
    roadName: 'Demo Road D',
    lengthM: 100,
    roadClass: 'U',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'both',
    lon: -1.494,
    lat: 52.506,
    forbCountBand: '3_5',
    indicatorIds: ['lotus-corniculatus'],
    nutrientDominantIds: ['urtica-dioica'],
    swardStructure: 'tall_rank',
    cutState: 'uncut',
    cuttingsState: 'left',
    lastCutMonth: null,
  },
  {
    roadName: 'Demo Road E',
    lengthM: 140,
    roadClass: 'U',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'both',
    lon: -1.492,
    lat: 52.508,
    forbCountBand: '3_5',
    indicatorIds: ['dactylorhiza-fuchsii'],
    nutrientDominantIds: [],
    swardStructure: 'short_uniform',
    cutState: 'unknown',
    cuttingsState: 'na',
    lastCutMonth: null,
  },
];

export async function loadDemoWorkspace(): Promise<Workspace> {
  const existing = (await workspaceRepo.list()).find((w) => w.isDemo);
  const workspace =
    existing ?? (await workspaceRepo.create({ name: 'Demo workspace', isDemo: true }));
  const already = await segmentRepo.listByWorkspace(workspace.id, true);
  const presentNames = new Set(already.map((s) => s.roadName));

  for (const fixture of FIXTURES) {
    if (presentNames.has(fixture.roadName)) continue;
    const segment = await segmentRepo.create({
      workspaceId: workspace.id,
      geometry: {
        type: 'LineString',
        coordinates: [
          [fixture.lon, fixture.lat],
          [fixture.lon + 0.001, fixture.lat + 0.0005],
        ],
      },
      lengthM: fixture.lengthM,
      roadClass: fixture.roadClass,
      setting: fixture.setting,
      widthBand: fixture.widthBand,
      side: fixture.side,
      roadName: fixture.roadName,
      isDemo: true,
    });
    const indicators = fixture.indicatorIds
      .map((id) => indicatorById(INDICATOR_SPECIES, id))
      .filter((item) => item !== undefined);
    const scoreResult = calculateTriageScore({
      forbCountBand: fixture.forbCountBand,
      indicators,
      nutrientDominantCount: fixture.nutrientDominantIds.length,
      swardStructure: fixture.swardStructure,
      cutState: fixture.cutState,
      cuttingsState: fixture.cuttingsState,
      lastCutMonth: fixture.lastCutMonth,
    });
    await observationRepo.create({
      segmentId: segment.id,
      observedAt: new Date().toISOString(),
      forbCountBand: fixture.forbCountBand,
      indicatorIds: fixture.indicatorIds,
      nutrientDominantIds: fixture.nutrientDominantIds,
      swardStructure: fixture.swardStructure,
      cutState: fixture.cutState,
      cuttingsState: fixture.cuttingsState,
      lastCutMonth: fixture.lastCutMonth,
      notes: 'Synthetic demo data.',
      photoIds: [],
      scoringVersion: 'verge-triage-v1',
      scoreResult,
      isDemo: true,
    });
  }

  await db.appSettings.put({ key: 'demoActive', value: 'true' });
  return workspace;
}
