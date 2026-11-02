/**
 * Shared Dexie seeding for page tests. Not a test file itself.
 * Uses the same repository calls the app uses, so seeded rows carry
 * the same score calculation as a real survey.
 */
import { db } from '../src/db/schema';
import { workspaceRepo } from '../src/db/repositories/WorkspaceRepository';
import { segmentRepo } from '../src/db/repositories/SegmentRepository';
import { observationRepo } from '../src/db/repositories/ObservationRepository';
import type { VergeSegment, SurveyObservation, Workspace } from '@verge-ledger/core';

export async function clearDb(): Promise<void> {
  await db.workspaces.clear();
  await db.vergeSegments.clear();
  await db.surveyObservations.clear();
  await db.photos.clear();
  await db.localDrafts.clear();
  await db.councilFacts.clear();
  await db.appSettings.clear();
}

export async function seedSurvey(): Promise<{
  workspace: Workspace;
  segment: VergeSegment;
  observation: SurveyObservation;
}> {
  const workspace = await workspaceRepo.create({ name: 'Test Parish' });
  const segment = await segmentRepo.create({
    workspaceId: workspace.id,
    geometry: {
      type: 'LineString',
      coordinates: [
        [-0.1278, 51.5074],
        [-0.1281, 51.508],
      ],
    },
    lengthM: 70.5,
    roadClass: 'C',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'left',
    roadName: 'Church Lane',
    isDemo: false,
  });
  const observation = await observationRepo.create({
    segmentId: segment.id,
    observedAt: new Date().toISOString(),
    forbCountBand: '10_14',
    indicatorIds: ['birds_foot_trefoil', 'oxeye_daisy'],
    nutrientDominantIds: [],
    swardStructure: 'medium_mixed',
    cutState: 'uncut',
    cuttingsState: 'removed',
    lastCutMonth: null,
    cutsPerYear: 1,
    notes: 'Diverse wildflower verge',
    photoIds: [],
    scoringVersion: 'verge-triage-v1',
    isDemo: false,
  });
  return { workspace, segment, observation };
}

export async function seedCouncilFact(): Promise<void> {
  await db.councilFacts.add({
    id: '01TESTCOUNCILFACT00000001',
    councilId: 'example-county',
    authorityName: 'Example County Council',
    tier: 'county',
    policyType: 'rural',
    lastVerifiedAt: '2026-01-01',
    key: 'ruralCutsPerYear',
    value: 2,
    sourceUrl: 'https://example.org/council-policy',
    sourceRetrievedAt: '2026-01-01',
    status: 'unverified',
  });
}
