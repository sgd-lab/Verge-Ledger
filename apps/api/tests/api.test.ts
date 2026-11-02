import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { SurveyObservation, VergeSegment } from '@verge-ledger/core';
import { buildApp } from '../src/app.js';
import { createStore } from '../src/store.js';

const ADMIN_KEY = 'test-admin-key';
const NOW = '2026-11-02T12:00:00.000Z';

function segment(overrides: Partial<VergeSegment> = {}): VergeSegment {
  return {
    id: '01J00000000000000000000001',
    workspaceId: '01J00000000000000000000000',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-1.5, 53.8],
        [-1.49, 53.81],
      ],
    },
    lengthM: 100,
    roadClass: 'C',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'left',
    roadName: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    isDemo: false,
    ...overrides,
  };
}

function observation(overrides: Partial<SurveyObservation> = {}): SurveyObservation {
  return {
    id: '01J00000000000000000000002',
    segmentId: '01J00000000000000000000001',
    observedAt: NOW,
    forbCountBand: '3_5',
    indicatorIds: [],
    nutrientDominantIds: [],
    swardStructure: 'medium_mixed',
    cutState: 'uncut',
    cuttingsState: 'na',
    lastCutMonth: null,
    notes: null,
    photoIds: [],
    scoringVersion: 'verge-triage-v1',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    isDemo: false,
    ...overrides,
  };
}

describe('Verge Ledger API', () => {
  let app: FastifyInstance;
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    app = buildApp({ store, adminKey: ADMIN_KEY });
  });

  afterEach(async () => {
    await app.close();
  });

  async function createWorkspace(): Promise<{ id: string; editKey: string }> {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      payload: { name: 'Test workspace' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; editKey: string };
    expect(body.editKey).toBeTruthy();
    return body;
  }

  it('health returns liveness and version without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; version: string; storage: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.storage).toBe('memory');
  });

  it('workspace creation returns the edit key only once', async () => {
    const { id, editKey } = await createWorkspace();
    // No endpoint returns the key again: a sync with a wrong key fails, and
    // export with the real key works, proving the key itself is not stored
    // in a retrievable form anywhere in responses.
    const wrong = await app.inject({
      method: 'GET',
      url: `/v1/workspaces/${id}/export`,
      headers: { 'x-edit-key': 'wrong-key' },
    });
    expect(wrong.statusCode).toBe(401);
    expect(wrong.body).not.toContain(editKey);
    const ok = await app.inject({
      method: 'GET',
      url: `/v1/workspaces/${id}/export`,
      headers: { 'x-edit-key': editKey },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.body).not.toContain(editKey);
  });

  it('rejects unknown fields in workspace creation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      payload: { name: 'Test', surprise: true },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { type: string }).type).toBe('about:blank');
  });

  it('sync applies last-write-wins, tombstones, and rejects future updatedAt', async () => {
    const { id, editKey } = await createWorkspace();
    const headers = { 'x-edit-key': editKey };
    const seg = segment({ workspaceId: id });

    const first = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${id}/sync`,
      headers,
      payload: { segments: [seg], observations: [observation()] },
    });
    expect(first.statusCode).toBe(200);
    expect((first.json() as { applied: { segments: number } }).applied.segments).toBe(1);

    // Older version of the same segment must not overwrite the newer one.
    const older = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${id}/sync`,
      headers,
      payload: {
        segments: [
          segment({ workspaceId: id, roadName: 'Old Road', updatedAt: '2026-11-02T11:00:00.000Z' }),
        ],
      },
    });
    const olderBody = older.json() as { ignored: { segments: number }; segments: VergeSegment[] };
    expect(olderBody.ignored.segments).toBe(1);
    expect(olderBody.segments[0]?.roadName).toBeNull();

    // Tombstone the segment: it leaves the live set and appears as a tombstone.
    const tombstoned = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${id}/sync`,
      headers,
      payload: {
        segments: [
          segment({
            workspaceId: id,
            updatedAt: '2026-11-02T13:00:00.000Z',
            deletedAt: '2026-11-02T13:00:00.000Z',
          }),
        ],
      },
    });
    const tombBody = tombstoned.json() as {
      segments: VergeSegment[];
      tombstones: { recordId: string; recordType: string }[];
    };
    expect(tombBody.segments).toHaveLength(0);
    expect(tombBody.tombstones).toHaveLength(1);
    expect(tombBody.tombstones[0]?.recordType).toBe('segment');

    // A record more than 5 minutes in the future is rejected outright.
    const future = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${id}/sync`,
      headers,
      payload: {
        segments: [
          segment({
            workspaceId: id,
            id: '01J00000000000000000000009',
            updatedAt: '2999-01-01T00:00:00.000Z',
          }),
        ],
      },
    });
    expect(future.statusCode).toBe(400);

    // Demo records and records carrying photos are never accepted.
    const demo = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${id}/sync`,
      headers,
      payload: {
        segments: [segment({ workspaceId: id, id: '01J00000000000000000000008', isDemo: true })],
      },
    });
    expect(demo.statusCode).toBe(400);
  });

  it('export returns GeoJSON by default and CSV on request', async () => {
    const { id, editKey } = await createWorkspace();
    const headers = { 'x-edit-key': editKey };
    await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${id}/sync`,
      headers,
      payload: { segments: [segment({ workspaceId: id })], observations: [observation()] },
    });
    const geo = await app.inject({ method: 'GET', url: `/v1/workspaces/${id}/export`, headers });
    expect(geo.statusCode).toBe(200);
    expect((geo.json() as { type: string; features: unknown[] }).type).toBe('FeatureCollection');
    expect((geo.json() as { features: unknown[] }).features).toHaveLength(1);
    const csv = await app.inject({
      method: 'GET',
      url: `/v1/workspaces/${id}/export?format=csv`,
      headers,
    });
    expect(csv.statusCode).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.body).toContain('segment_id');
  });

  it('councils show verified facts only by default', async () => {
    store.insertCouncil({
      id: 'test-council',
      name: 'Test Council',
      type: 'district',
      region: 'Testshire',
      createdAt: NOW,
      updatedAt: NOW,
    });
    const proposed = await app.inject({
      method: 'POST',
      url: '/v1/councils/test-council/facts',
      payload: {
        key: 'ruralCutsPerYear',
        value: 2,
        sourceUrl: 'https://example.org/cuts',
        sourceRetrievedAt: '2026-11-01',
      },
    });
    expect(proposed.statusCode).toBe(201);
    const fact = proposed.json() as { id: string; status: string };
    expect(fact.status).toBe('unverified');

    const list = await app.inject({ method: 'GET', url: '/v1/councils' });
    const councils = (list.json() as { councils: { id: string; facts: unknown[] }[] }).councils;
    expect(councils).toHaveLength(1);
    expect(councils[0]?.facts).toHaveLength(0);

    const all = await app.inject({ method: 'GET', url: '/v1/councils?verifiedOnly=false' });
    expect((all.json() as { councils: { facts: unknown[] }[] }).councils[0]?.facts).toHaveLength(1);

    // Fact proposals require a source and retrieval date.
    const noSource = await app.inject({
      method: 'POST',
      url: '/v1/councils/test-council/facts',
      payload: { key: 'ruralCutsPerYear', value: 2 },
    });
    expect(noSource.statusCode).toBe(400);
    expect(fact.id).toBeTruthy();
  });

  it('admin review rejects a wrong key and verifies with the right key', async () => {
    store.insertCouncil({
      id: 'test-council',
      name: 'Test Council',
      type: 'district',
      region: 'Testshire',
      createdAt: NOW,
      updatedAt: NOW,
    });
    const proposed = await app.inject({
      method: 'POST',
      url: '/v1/councils/test-council/facts',
      payload: {
        key: 'urbanCutsPerYear',
        value: 3,
        sourceUrl: 'https://example.org/urban-cuts',
        sourceRetrievedAt: '2026-11-01',
      },
    });
    const fact = proposed.json() as { id: string };

    const wrong = await app.inject({
      method: 'POST',
      url: `/v1/admin/facts/${fact.id}/review`,
      headers: { 'x-admin-key': 'wrong-key' },
      payload: { decision: 'verified' },
    });
    expect(wrong.statusCode).toBe(401);

    const right = await app.inject({
      method: 'POST',
      url: `/v1/admin/facts/${fact.id}/review`,
      headers: { 'x-admin-key': ADMIN_KEY },
      payload: { decision: 'verified' },
    });
    expect(right.statusCode).toBe(200);
    expect((right.json() as { status: string }).status).toBe('verified');

    const detail = await app.inject({ method: 'GET', url: '/v1/councils/test-council' });
    expect((detail.json() as { facts: unknown[] }).facts).toHaveLength(1);
  });

  it('admin review can reject a fact so it never surfaces', async () => {
    store.insertCouncil({
      id: 'test-council',
      name: 'Test Council',
      type: 'district',
      region: 'Testshire',
      createdAt: NOW,
      updatedAt: NOW,
    });
    const proposed = await app.inject({
      method: 'POST',
      url: '/v1/councils/test-council/facts',
      payload: {
        key: 'other',
        value: 'something',
        sourceUrl: 'https://example.org/other',
        sourceRetrievedAt: '2026-11-01',
      },
    });
    const fact = proposed.json() as { id: string };
    const rejected = await app.inject({
      method: 'POST',
      url: `/v1/admin/facts/${fact.id}/review`,
      headers: { 'x-admin-key': ADMIN_KEY },
      payload: { decision: 'rejected' },
    });
    expect(rejected.statusCode).toBe(200);
    const all = await app.inject({ method: 'GET', url: '/v1/councils?verifiedOnly=false' });
    expect((all.json() as { councils: { facts: unknown[] }[] }).councils[0]?.facts).toHaveLength(0);
  });

  it('impact events increment only packs/requests counters, aggregates only', async () => {
    const before = await app.inject({ method: 'GET', url: '/v1/impact' });
    expect((before.json() as { counters: Record<string, number> }).counters.packsGenerated).toBe(0);

    const event = await app.inject({
      method: 'POST',
      url: '/v1/impact/events',
      payload: { counter: 'packsGenerated', increment: 2 },
    });
    expect(event.statusCode).toBe(201);
    expect((event.json() as { value: number }).value).toBe(2);

    const bad = await app.inject({
      method: 'POST',
      url: '/v1/impact/events',
      payload: { counter: 'kmSurveyed', increment: 5 },
    });
    expect(bad.statusCode).toBe(400);

    const after = await app.inject({ method: 'GET', url: '/v1/impact' });
    const counters = (after.json() as { counters: Record<string, number> }).counters;
    expect(counters.packsGenerated).toBe(2);
    expect(counters.requestsGenerated).toBe(0);
    expect(counters.kmSurveyed).toBe(0);
  });

  it('returns RFC 9457-style problems for unknown routes and missing workspaces', async () => {
    const missing = await app.inject({ method: 'GET', url: '/v1/workspaces/nope/export' });
    expect(missing.statusCode).toBe(404);
    const body = missing.json() as { type: string; title: string; status: number };
    expect(body.type).toBe('about:blank');
    expect(body.status).toBe(404);
    expect(body.title).toBeTruthy();
  });
});
