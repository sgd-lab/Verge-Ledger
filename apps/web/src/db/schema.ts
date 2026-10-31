import { Dexie, type EntityTable } from 'dexie';
import { indexedDB as fakeIDB, IDBKeyRange as fakeKeyRange } from 'fake-indexeddb';
import type { Workspace, VergeSegment, SurveyObservation } from '@verge-ledger/core';

if (typeof indexedDB === 'undefined' || !Dexie.dependencies.indexedDB) {
  Dexie.dependencies.indexedDB = fakeIDB;
  Dexie.dependencies.IDBKeyRange = fakeKeyRange;
}

export interface PhotoRecord {
  id: string; // ULID
  observationId: string; // Foreign key -> SurveyObservation.id
  blob: Blob; // Raw binary image with stripped EXIF
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  capturedAt: string; // ISO 8601 UTC
  isDemo: boolean;
}

export interface CutRegimeRecord {
  id: string; // e.g. 'R1', 'RA', 'RB', 'RU'
  code: string; // 'R1'
  name: string;
  category: 'rural' | 'urban' | 'safety' | 'conservation';
  cutsPerYear: number;
  months: string;
  description: string;
  conditions?: string;
}

export interface LocalDraftRecord {
  id: string; // 'current-survey-draft' or ULID
  step: number; // 1 | 2 | 3 | 4
  data: Record<string, unknown>; // Form state payload
  updatedAt: string; // ISO 8601 UTC
}

export interface CouncilFactRecord {
  id: string; // ULID
  councilId: string;
  authorityName: string;
  tier: 'county' | 'unitary' | 'district' | 'parish';
  policyType: 'rural' | 'urban' | 'safety' | 'designated';
  lastVerifiedAt: string; // ISO 8601 Date
  key: string;
  value: string | number | boolean;
  sourceUrl: string;
  sourceRetrievedAt: string;
  status: 'unverified' | 'verified';
}

export interface AppSettingRecord {
  key: string; // e.g. 'activeWorkspaceId', 'tileUrl', 'theme', 'safetyAcknowledgedAt'
  value: unknown;
}

export class VergeLedgerDB extends Dexie {
  workspaces!: EntityTable<Workspace, 'id'>;
  vergeSegments!: EntityTable<VergeSegment, 'id'>;
  surveyObservations!: EntityTable<SurveyObservation, 'id'>;
  photos!: EntityTable<PhotoRecord, 'id'>;
  cutRegimes!: EntityTable<CutRegimeRecord, 'id'>;
  localDrafts!: EntityTable<LocalDraftRecord, 'id'>;
  councilFacts!: EntityTable<CouncilFactRecord, 'id'>;
  appSettings!: EntityTable<AppSettingRecord, 'key'>;

  constructor() {
    super('VergeLedgerDB');

    this.version(1).stores({
      workspaces: '&id, name, createdAt, updatedAt, isDemo',
      vergeSegments:
        '&id, workspaceId, roadClass, setting, widthBand, side, roadName, createdAt, updatedAt, deletedAt, isDemo, [workspaceId+updatedAt]',
      surveyObservations:
        '&id, segmentId, observedAt, forbCountBand, swardStructure, cutState, cuttingsState, lastCutMonth, scoringVersion, createdAt, updatedAt, deletedAt, isDemo, [segmentId+updatedAt]',
      photos: '&id, observationId, mimeType, capturedAt, isDemo',
      cutRegimes: '&id, code, name, category, cutsPerYear',
      localDrafts: '&id, step, updatedAt',
      councilFacts: '&id, councilId, authorityName, tier, policyType, lastVerifiedAt',
      appSettings: '&key',
    });
  }
}

export const db = new VergeLedgerDB();
