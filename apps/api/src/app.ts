import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {
  CouncilFactSchema,
  exportToCsv,
  exportToGeoJson,
  type CouncilFact,
  type SurveyObservation,
  type VergeSegment,
} from '@verge-ledger/core';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import { ZodError } from 'zod';
import { createStore, type MemoryStore } from './store.js';
import { generateEditKey, hashEditKey, verifyAdminKey, verifyEditKey } from './auth.js';
import { generateUlid } from './ulid.js';
import { sendProblem, validationDetail } from './problems.js';
import {
  CouncilsQuerySchema,
  CreateWorkspaceBodySchema,
  ExportQuerySchema,
  ImpactEventBodySchema,
  ProposeFactBodySchema,
  ReviewFactBodySchema,
  SyncBodySchema,
} from './schemas.js';
import { API_VERSION } from './version.js';

export interface BuildAppOptions {
  store?: MemoryStore;
  /** Overrides VERGE_ADMIN_KEY (tests pass this explicitly; production uses env). */
  adminKey?: string;
}

const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

function isTooFarInFuture(updatedAt: string, nowMs: number): boolean {
  return Date.parse(updatedAt) > nowMs + FUTURE_TOLERANCE_MS;
}

function presentedKey(request: FastifyRequest, headerName: string): string | undefined {
  const header = request.headers[headerName];
  if (typeof header === 'string' && header.length > 0) {
    return header;
  }
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length);
  }
  return undefined;
}

function paramsId(request: FastifyRequest): string {
  const params = request.params as { id?: unknown };
  return typeof params.id === 'string' ? params.id : '';
}

function parseQuery<T>(request: FastifyRequest, parse: (query: unknown) => T): T | ZodError {
  try {
    return parse(request.query);
  } catch (error) {
    if (error instanceof ZodError) {
      return error;
    }
    throw error;
  }
}

function parseBody<T>(request: FastifyRequest, parse: (body: unknown) => T): T | ZodError {
  try {
    return parse(request.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return error;
    }
    throw error;
  }
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const store = options.store ?? createStore();
  const adminKey = options.adminKey ?? process.env.VERGE_ADMIN_KEY;
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });
  void app.register(helmet);
  // All write endpoints are rate-limited; fact proposals and impact events
  // get tighter per-route limits below.
  void app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  app.setNotFoundHandler((request, reply) => {
    sendProblem(reply, 404, 'Not found', `No route matches ${request.method} ${request.url}`);
  });

  app.setErrorHandler((error, _request, reply) => {
    if (reply.sent) {
      return;
    }
    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    sendProblem(reply, status, status === 500 ? 'Internal error' : 'Request failed', error.message);
  });

  app.get('/v1/health', async (_request, reply) => {
    await reply.send({ status: 'ok', version: API_VERSION, storage: store.storage });
  });

  app.post('/v1/workspaces', async (request, reply) => {
    const parsed = parseBody(request, (body) => CreateWorkspaceBodySchema.parse(body));
    if (parsed instanceof ZodError) {
      sendProblem(reply, 400, 'Validation failed', validationDetail(parsed));
      return;
    }
    const editKey = generateEditKey();
    const { hash, salt } = hashEditKey(editKey);
    const now = nowIso();
    const record = store.createWorkspace({
      id: generateUlid(),
      name: parsed.name,
      createdAt: now,
      updatedAt: now,
      isDemo: parsed.isDemo,
      editKeyHash: hash,
      editKeySalt: salt,
    });
    // The raw edit key is returned exactly once, here. It is never stored
    // and no endpoint returns it again.
    await reply.status(201).send({
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      isDemo: record.isDemo,
      editKey,
    });
  });

  app.post('/v1/workspaces/:id/sync', async (request, reply) => {
    const workspaceId = paramsId(request);
    const workspace = store.getWorkspace(workspaceId);
    if (!workspace) {
      sendProblem(reply, 404, 'Workspace not found', `No workspace with id ${workspaceId}`);
      return;
    }
    const key = presentedKey(request, 'x-edit-key');
    if (!key || !verifyEditKey(key, workspace.editKeyHash, workspace.editKeySalt)) {
      sendProblem(reply, 401, 'Unauthorized', 'A valid edit key is required');
      return;
    }
    const parsed = parseBody(request, (body) => SyncBodySchema.parse(body));
    if (parsed instanceof ZodError) {
      sendProblem(reply, 400, 'Validation failed', validationDetail(parsed));
      return;
    }
    const nowMs = Date.now();
    const problems: string[] = [];
    for (const segment of parsed.segments) {
      if (segment.workspaceId !== workspaceId) {
        problems.push(`segment ${segment.id}: workspaceId does not match the workspace`);
      }
      if (segment.isDemo) {
        problems.push(`segment ${segment.id}: demo records are never accepted`);
      }
      if (isTooFarInFuture(segment.updatedAt, nowMs)) {
        problems.push(`segment ${segment.id}: updatedAt is more than 5 minutes in the future`);
      }
    }
    const incomingLiveSegmentIds = new Set(
      parsed.segments.filter((s) => s.deletedAt === null).map((s) => s.id),
    );
    const incomingSegmentIds = new Set(parsed.segments.map((s) => s.id));
    for (const observation of parsed.observations) {
      if (observation.isDemo) {
        problems.push(`observation ${observation.id}: demo records are never accepted`);
      }
      if (isTooFarInFuture(observation.updatedAt, nowMs)) {
        problems.push(
          `observation ${observation.id}: updatedAt is more than 5 minutes in the future`,
        );
      }
      if (observation.photoIds.length > 0) {
        problems.push(`observation ${observation.id}: photos are never synced`);
      }
      if (observation.deletedAt === null) {
        if (
          !store.hasSegment(observation.segmentId) &&
          !incomingLiveSegmentIds.has(observation.segmentId)
        ) {
          problems.push(`observation ${observation.id}: segment does not exist in this workspace`);
        }
      } else if (
        !store.hasSegmentOrTombstone(observation.segmentId) &&
        !incomingSegmentIds.has(observation.segmentId)
      ) {
        problems.push(`observation ${observation.id}: segment does not exist in this workspace`);
      }
    }
    if (problems.length > 0) {
      sendProblem(reply, 400, 'Sync rejected', problems.join('; '));
      return;
    }
    let appliedSegments = 0;
    let appliedObservations = 0;
    let ignoredSegments = 0;
    let ignoredObservations = 0;
    for (const segment of parsed.segments) {
      if (store.applySegment(segment) === 'applied') {
        appliedSegments += 1;
      } else {
        ignoredSegments += 1;
      }
    }
    for (const observation of parsed.observations) {
      if (store.applyObservation(observation, workspaceId) === 'applied') {
        appliedObservations += 1;
      } else {
        ignoredObservations += 1;
      }
    }
    const sinceMs = parsed.since ? Date.parse(parsed.since) : undefined;
    const afterSince = (updatedAt: string): boolean =>
      sinceMs === undefined || Date.parse(updatedAt) > sinceMs;
    const segments = store.listSegments(workspaceId).filter((s) => afterSince(s.updatedAt));
    const observations = store.listObservations(workspaceId).filter((o) => afterSince(o.updatedAt));
    const tombstones = store.listTombstones(workspaceId).filter((t) => afterSince(t.updatedAt));
    await reply.send({
      workspaceId,
      serverTime: nowIso(),
      applied: { segments: appliedSegments, observations: appliedObservations },
      ignored: { segments: ignoredSegments, observations: ignoredObservations },
      segments,
      observations,
      tombstones,
    });
  });

  app.get('/v1/workspaces/:id/export', async (request, reply) => {
    const workspaceId = paramsId(request);
    const workspace = store.getWorkspace(workspaceId);
    if (!workspace) {
      sendProblem(reply, 404, 'Workspace not found', `No workspace with id ${workspaceId}`);
      return;
    }
    const key = presentedKey(request, 'x-edit-key');
    if (!key || !verifyEditKey(key, workspace.editKeyHash, workspace.editKeySalt)) {
      sendProblem(reply, 401, 'Unauthorized', 'A valid edit key is required');
      return;
    }
    const query = parseQuery(request, (q) => ExportQuerySchema.parse(q));
    if (query instanceof ZodError) {
      sendProblem(reply, 400, 'Validation failed', validationDetail(query));
      return;
    }
    const segments: VergeSegment[] = store.listSegments(workspaceId);
    const observations: SurveyObservation[] = store.listObservations(workspaceId);
    if (query.format === 'csv') {
      await reply.type('text/csv').send(exportToCsv(segments, observations, INDICATOR_SPECIES));
      return;
    }
    await reply
      .type('application/geo+json')
      .send(exportToGeoJson(segments, observations, INDICATOR_SPECIES));
  });

  const councilWithFacts = (
    councilId: string,
    verifiedOnly: boolean,
  ): Record<string, unknown> | undefined => {
    const council = store.getCouncil(councilId);
    if (!council) {
      return undefined;
    }
    const facts = store
      .listFacts(councilId)
      .filter((fact) => !verifiedOnly || fact.status === 'verified');
    return { ...council, facts };
  };

  app.get('/v1/councils', async (request, reply) => {
    const query = parseQuery(request, (q) => CouncilsQuerySchema.parse(q));
    if (query instanceof ZodError) {
      sendProblem(reply, 400, 'Validation failed', validationDetail(query));
      return;
    }
    const verifiedOnly = query.verifiedOnly === 'true';
    const councils = store
      .listCouncils()
      .map((council) => councilWithFacts(council.id, verifiedOnly))
      .filter((c): c is Record<string, unknown> => c !== undefined);
    await reply.send({ councils });
  });

  app.get('/v1/councils/:id', async (request, reply) => {
    const query = parseQuery(request, (q) => CouncilsQuerySchema.parse(q));
    if (query instanceof ZodError) {
      sendProblem(reply, 400, 'Validation failed', validationDetail(query));
      return;
    }
    const council = councilWithFacts(paramsId(request), query.verifiedOnly === 'true');
    if (!council) {
      sendProblem(reply, 404, 'Council not found', `No council with id ${paramsId(request)}`);
      return;
    }
    await reply.send(council);
  });

  app.post(
    '/v1/councils/:id/facts',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const councilId = paramsId(request);
      if (!store.getCouncil(councilId)) {
        sendProblem(reply, 404, 'Council not found', `No council with id ${councilId}`);
        return;
      }
      const parsed = parseBody(request, (body) => ProposeFactBodySchema.parse(body));
      if (parsed instanceof ZodError) {
        sendProblem(reply, 400, 'Validation failed', validationDetail(parsed));
        return;
      }
      const candidate: CouncilFact = {
        id: generateUlid(),
        councilId,
        key: parsed.key,
        value: parsed.value,
        sourceUrl: parsed.sourceUrl,
        sourceRetrievedAt: parsed.sourceRetrievedAt,
        status: 'unverified',
        submittedAt: nowIso(),
        reviewedAt: null,
      };
      // Validate the assembled record against the core schema before storing.
      const fact = CouncilFactSchema.parse(candidate);
      store.createFact(fact);
      await reply.status(201).send(fact);
    },
  );

  app.post('/v1/admin/facts/:id/review', async (request, reply) => {
    if (!adminKey) {
      sendProblem(reply, 503, 'Admin review not configured', 'VERGE_ADMIN_KEY is not set');
      return;
    }
    const key = presentedKey(request, 'x-admin-key');
    if (!key || !verifyAdminKey(key, adminKey)) {
      sendProblem(reply, 401, 'Unauthorized', 'A valid admin key is required');
      return;
    }
    const parsed = parseBody(request, (body) => ReviewFactBodySchema.parse(body));
    if (parsed instanceof ZodError) {
      sendProblem(reply, 400, 'Validation failed', validationDetail(parsed));
      return;
    }
    const factId = paramsId(request);
    const fact = store.getFact(factId);
    if (!fact) {
      sendProblem(reply, 404, 'Fact not found', `No fact with id ${factId}`);
      return;
    }
    if (parsed.decision === 'verified') {
      const verified = store.verifyFact(factId, nowIso());
      await reply.send(verified);
      return;
    }
    // A rejected proposal is removed so it can never surface as a fact.
    store.deleteFact(factId);
    await reply.send({ id: factId, decision: 'rejected' });
  });

  app.post(
    '/v1/impact/events',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = parseBody(request, (body) => ImpactEventBodySchema.parse(body));
      if (parsed instanceof ZodError) {
        sendProblem(reply, 400, 'Validation failed', validationDetail(parsed));
        return;
      }
      const value = store.incrementCounter(parsed.counter, parsed.increment, nowIso());
      await reply.status(201).send({ counter: parsed.counter, value });
    },
  );

  app.get('/v1/impact', async (_request, reply) => {
    await reply.send({ counters: store.getCounters() });
  });

  return app;
}
