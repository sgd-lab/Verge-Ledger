/**
 * @vitest-environment jsdom
 */
import '../setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/schema';
import { workspaceRepo } from '../../src/db/repositories/WorkspaceRepository';
import { segmentRepo } from '../../src/db/repositories/SegmentRepository';
import { observationRepo } from '../../src/db/repositories/ObservationRepository';
import { draftRepo } from '../../src/db/repositories/DraftRepository';
import { generateUlid, isValidUlid } from '../../src/lib/id';

describe('Dexie Storage Layer & Repositories', () => {
  beforeEach(async () => {
    await db.workspaces.clear();
    await db.vergeSegments.clear();
    await db.surveyObservations.clear();
    await db.photos.clear();
    await db.localDrafts.clear();
    await db.appSettings.clear();
  });

  describe('ULID Generator', () => {
    it('generates valid 26-character Crockford Base32 monotonic IDs', () => {
      const id1 = generateUlid();
      const id2 = generateUlid();
      expect(isValidUlid(id1)).toBe(true);
      expect(isValidUlid(id2)).toBe(true);
      expect(id1 < id2).toBe(true);
    });
  });

  describe('WorkspaceRepository', () => {
    it('creates, retrieves, updates, and deletes workspaces', async () => {
      const ws = await workspaceRepo.create({ name: 'North Parish Council' });
      expect(ws.id).toBeDefined();
      expect(ws.name).toBe('North Parish Council');

      const list = await workspaceRepo.list();
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe(ws.id);

      const updated = await workspaceRepo.update(ws.id, { name: 'South Parish Council' });
      expect(updated.name).toBe('South Parish Council');

      await workspaceRepo.delete(ws.id);
      const remaining = await workspaceRepo.list();
      expect(remaining).toHaveLength(0);
    });
  });

  describe('SegmentRepository', () => {
    it('creates segments with valid GeoJSON LineString and enforces length bounds', async () => {
      const ws = await workspaceRepo.create({ name: 'Test Parish' });
      const segment = await segmentRepo.create({
        workspaceId: ws.id,
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

      expect(segment.id).toBeDefined();
      expect(segment.lengthM).toBe(70.5);

      const byWorkspace = await segmentRepo.listByWorkspace(ws.id);
      expect(byWorkspace).toHaveLength(1);

      await segmentRepo.softDelete(segment.id);
      const activeOnly = await segmentRepo.listByWorkspace(ws.id);
      expect(activeOnly).toHaveLength(0);
    });
  });

  describe('ObservationRepository', () => {
    it('creates observations and calculates triage score automatically', async () => {
      const ws = await workspaceRepo.create({ name: 'Test Parish' });
      const segment = await segmentRepo.create({
        workspaceId: ws.id,
        geometry: {
          type: 'LineString',
          coordinates: [
            [-0.1278, 51.5074],
            [-0.1281, 51.508],
          ],
        },
        lengthM: 50.0,
        roadClass: 'C',
        setting: 'rural',
        widthBand: '1_5_to_3',
        side: 'left',
        roadName: 'Green Lane',
        isDemo: false,
      });

      const obs = await observationRepo.create({
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

      expect(obs.id).toBeDefined();
      expect(obs.scoreResult).toBeDefined();
      expect(obs.scoreResult?.finalScore).toBeGreaterThan(0);
      expect(['promising', 'expert_review']).toContain(obs.scoreResult?.tier);
    });
  });

  describe('DraftRepository', () => {
    it('saves and clears survey draft', async () => {
      await draftRepo.saveDraft(1, { roadName: 'High Street' });
      const draft = await draftRepo.getDraft();
      expect(draft?.step).toBe(1);
      expect(draft?.data['roadName']).toBe('High Street');

      await draftRepo.clearDraft();
      const empty = await draftRepo.getDraft();
      expect(empty).toBeUndefined();
    });
  });
});
