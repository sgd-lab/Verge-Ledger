import type {
  Council,
  CouncilFact,
  ImpactCounterKey,
  SurveyObservation,
  VergeSegment,
} from '@verge-ledger/core';

/**
 * Storage for the optional API.
 *
 * better-sqlite3 was tried first in this VM and cannot build: `npm rebuild
 * better-sqlite3` fails with node-gyp EPERM on fchown while extracting its
 * tarball, and no prebuilt binding exists for this Node version. The store
 * below is therefore an in-memory implementation behind this thin query
 * layer. It keeps exactly the table shapes declared in SCHEMA_SQL, so a
 * SQLite backend can replace it later without changing the routes: each
 * method maps to one table (or one tombstone rule) below.
 *
 * Consequences of the in-memory choice: data does not survive a restart.
 * That is acceptable for an optional v0.1 API whose web app works fully
 * without it, and it must be revisited before any production use.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  isDemo INTEGER NOT NULL DEFAULT 0,
  editKeyHash TEXT NOT NULL,
  editKeySalt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS segments (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL,
  geometry TEXT NOT NULL,
  lengthM REAL NOT NULL,
  roadClass TEXT NOT NULL,
  setting TEXT NOT NULL,
  widthBand TEXT NOT NULL,
  side TEXT NOT NULL,
  roadName TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  isDemo INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  segmentId TEXT NOT NULL,
  observedAt TEXT NOT NULL,
  forbCountBand TEXT NOT NULL,
  indicatorIds TEXT NOT NULL,
  nutrientDominantIds TEXT NOT NULL,
  swardStructure TEXT NOT NULL,
  cutState TEXT NOT NULL,
  cuttingsState TEXT NOT NULL,
  lastCutMonth INTEGER,
  cutsPerYear INTEGER,
  notes TEXT,
  photoIds TEXT NOT NULL,
  scoringVersion TEXT NOT NULL,
  scoreResult TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  isDemo INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tombstones (
  recordType TEXT NOT NULL,
  recordId TEXT NOT NULL,
  workspaceId TEXT NOT NULL,
  deletedAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (recordType, recordId)
);
CREATE TABLE IF NOT EXISTS councils (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  region TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS council_facts (
  id TEXT PRIMARY KEY,
  councilId TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  sourceUrl TEXT NOT NULL,
  sourceRetrievedAt TEXT NOT NULL,
  status TEXT NOT NULL,
  submittedAt TEXT NOT NULL,
  reviewedAt TEXT
);
CREATE TABLE IF NOT EXISTS impact_counters (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT NOT NULL
);
`;

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
  /** scrypt hash (hex) of the edit key; the raw key is never stored. */
  editKeyHash: string;
  /** Per-workspace salt (hex) for the edit-key hash. */
  editKeySalt: string;
}

export type TombstoneRecordType = 'segment' | 'observation';

export interface Tombstone {
  recordType: TombstoneRecordType;
  recordId: string;
  workspaceId: string;
  deletedAt: string;
  updatedAt: string;
}

export type ApplyResult = 'applied' | 'ignored';

function isNewer(candidateMs: number, existingMs: number): boolean {
  return candidateMs > existingMs;
}

/** In-memory store with the table shapes in SCHEMA_SQL. */
export class MemoryStore {
  readonly storage = 'memory' as const;
  private readonly workspaces = new Map<string, WorkspaceRecord>();
  private readonly segments = new Map<string, VergeSegment>();
  private readonly observations = new Map<string, SurveyObservation>();
  private readonly tombstones = new Map<string, Tombstone>();
  private readonly councils = new Map<string, Council>();
  private readonly councilFacts = new Map<string, CouncilFact>();
  private readonly impactCounters = new Map<
    ImpactCounterKey,
    { value: number; updatedAt: string }
  >();

  createWorkspace(record: WorkspaceRecord): WorkspaceRecord {
    this.workspaces.set(record.id, record);
    return record;
  }

  getWorkspace(id: string): WorkspaceRecord | undefined {
    return this.workspaces.get(id);
  }

  /** Registry seeding (there is no public council-create endpoint in v0.1). */
  insertCouncil(council: Council): Council {
    this.councils.set(council.id, council);
    return council;
  }

  getCouncil(id: string): Council | undefined {
    return this.councils.get(id);
  }

  listCouncils(): Council[] {
    return [...this.councils.values()];
  }

  listSegments(workspaceId: string): VergeSegment[] {
    return [...this.segments.values()].filter((s) => s.workspaceId === workspaceId);
  }

  listObservations(workspaceId: string): SurveyObservation[] {
    const segmentIds = new Set(this.listSegments(workspaceId).map((s) => s.id));
    return [...this.observations.values()].filter((o) => segmentIds.has(o.segmentId));
  }

  /** Last-write-wins per record; equal timestamps keep the existing record. */
  applySegment(segment: VergeSegment): ApplyResult {
    const candidateMs = Date.parse(segment.updatedAt);
    const tombstone = this.tombstones.get(`segment:${segment.id}`);
    const live = this.segments.get(segment.id);
    if (segment.deletedAt !== null) {
      if (live && !isNewer(candidateMs, Date.parse(live.updatedAt))) {
        return 'ignored';
      }
      if (tombstone && !isNewer(candidateMs, Date.parse(tombstone.updatedAt))) {
        return 'ignored';
      }
      this.segments.delete(segment.id);
      this.tombstones.set(`segment:${segment.id}`, {
        recordType: 'segment',
        recordId: segment.id,
        workspaceId: segment.workspaceId,
        deletedAt: segment.deletedAt,
        updatedAt: segment.updatedAt,
      });
      return 'applied';
    }
    if (tombstone && !isNewer(candidateMs, Date.parse(tombstone.updatedAt))) {
      return 'ignored';
    }
    if (live && !isNewer(candidateMs, Date.parse(live.updatedAt))) {
      return 'ignored';
    }
    this.tombstones.delete(`segment:${segment.id}`);
    this.segments.set(segment.id, segment);
    return 'applied';
  }

  applyObservation(observation: SurveyObservation, workspaceId: string): ApplyResult {
    const candidateMs = Date.parse(observation.updatedAt);
    const tombstone = this.tombstones.get(`observation:${observation.id}`);
    const live = this.observations.get(observation.id);
    if (observation.deletedAt !== null) {
      if (live && !isNewer(candidateMs, Date.parse(live.updatedAt))) {
        return 'ignored';
      }
      if (tombstone && !isNewer(candidateMs, Date.parse(tombstone.updatedAt))) {
        return 'ignored';
      }
      this.observations.delete(observation.id);
      this.tombstones.set(`observation:${observation.id}`, {
        recordType: 'observation',
        recordId: observation.id,
        workspaceId,
        deletedAt: observation.deletedAt,
        updatedAt: observation.updatedAt,
      });
      return 'applied';
    }
    if (tombstone && !isNewer(candidateMs, Date.parse(tombstone.updatedAt))) {
      return 'ignored';
    }
    if (live && !isNewer(candidateMs, Date.parse(live.updatedAt))) {
      return 'ignored';
    }
    this.tombstones.delete(`observation:${observation.id}`);
    this.observations.set(observation.id, observation);
    return 'applied';
  }

  listTombstones(workspaceId: string): Tombstone[] {
    return [...this.tombstones.values()].filter((t) => t.workspaceId === workspaceId);
  }

  hasSegment(id: string): boolean {
    return this.segments.has(id);
  }

  hasSegmentOrTombstone(id: string): boolean {
    return this.segments.has(id) || this.tombstones.has(`segment:${id}`);
  }

  listFacts(councilId: string): CouncilFact[] {
    return [...this.councilFacts.values()].filter((f) => f.councilId === councilId);
  }

  createFact(fact: CouncilFact): CouncilFact {
    this.councilFacts.set(fact.id, fact);
    return fact;
  }

  getFact(id: string): CouncilFact | undefined {
    return this.councilFacts.get(id);
  }

  verifyFact(id: string, reviewedAt: string): CouncilFact | undefined {
    const fact = this.councilFacts.get(id);
    if (!fact) {
      return undefined;
    }
    const verified: CouncilFact = { ...fact, status: 'verified', reviewedAt };
    this.councilFacts.set(id, verified);
    return verified;
  }

  deleteFact(id: string): boolean {
    return this.councilFacts.delete(id);
  }

  incrementCounter(key: ImpactCounterKey, by: number, updatedAt: string): number {
    const current = this.impactCounters.get(key)?.value ?? 0;
    const value = current + by;
    this.impactCounters.set(key, { value, updatedAt });
    return value;
  }

  getCounters(): Record<ImpactCounterKey, number> {
    const keys: ImpactCounterKey[] = [
      'kmSurveyed',
      'segmentsScored',
      'segmentsFlagged',
      'packsGenerated',
      'requestsGenerated',
      'activeWorkspaces',
    ];
    const out = {} as Record<ImpactCounterKey, number>;
    for (const key of keys) {
      out[key] = this.impactCounters.get(key)?.value ?? 0;
    }
    return out;
  }
}

export type Store = MemoryStore;

export function createStore(): MemoryStore {
  return new MemoryStore();
}
