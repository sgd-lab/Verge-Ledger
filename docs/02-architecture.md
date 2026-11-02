# 02 - Architecture, Data Model and API

Read with 03-method-and-rules.

## 1\. Design principles

1. The core value works with no server. Survey, score, advisor, simulator, request builder and evidence pack run entirely in the browser.
2. The API is optional. It adds shared registry, workspace sync and aggregate impact counters.
3. Deterministic domain logic lives in a pure TypeScript package with no browser or Node dependencies, so it is trivially testable.
4. Boring, portable stack (React, Tailwind, Node).
5. Every external fact carries a source URL and retrieval date.

## 2\. Stack

| Layer           | Choice                                                                | Notes                                                                     |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Language        | TypeScript, strict mode                                               | Shared types across packages                                              |
| Monorepo        | npm workspaces                                                        | No extra tooling needed                                                   |
| Web             | Vite, React, React Router, Tailwind CSS                               | Code-split map and report routes                                          |
| Map             | Leaflet with a configurable tile URL                                  | Attribution always visible. Default OSM tiles for dev and light demo only |
| Local storage   | Dexie over IndexedDB                                                  | Repositories wrap Dexie so storage can be swapped                         |
| PWA             | Hand-written service worker via Workbox or vite-plugin-pwa            | Precache shell. Runtime cache tiles with a size cap                       |
| Validation      | zod                                                                   | Schemas live in packages/core and are used by web and API                 |
| API             | Node LTS with Fastify                                                 | Small surface, schema-driven                                              |
| Database        | SQLite via better-sqlite3 with a thin query layer (Kysely or Drizzle) | Single file, easy backup, portable                                        |
| Tests           | Vitest (unit, integration), Playwright (end-to-end), axe-core (a11y)  |                                                                           |
| Lint and format | ESLint flat config, Prettier                                          |                                                                           |
| Commits         | Conventional Commits, commitlint, husky, lint-staged                  |                                                                           |
| CI              | GitHub Actions                                                        | lint, typecheck, test, build, audit, licence check                        |

If a dependency choice is blocked, pick the nearest MIT, Apache-2.0, BSD or ISC alternative and record the decision in docs/DECISIONS.md.

## 3\. Repository layout

```
verge-ledger/
  AGENTS.md
  README.md
  LICENSE
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  CHANGELOG.md
  .github/
    workflows/ci.yml
    workflows/pages.yml
    ISSUE_TEMPLATE/
    pull_request_template.md
  docs/
    02-architecture.md
    03-method-and-rules.md
    DATA.md
    PRIVACY.md
    ACCESSIBILITY.md
    DECISIONS.md
    OPEN-QUESTIONS.md
  packages/
    core/        pure domain logic, schemas, exporters, rules
    data/        JSON data with schemas: indicators, regimes, councils
  apps/
    web/         Vite React PWA
    api/         Fastify API (optional)
  e2e/           Playwright tests
  deploy/
    docker/
```

## 4\. Domain model (packages/core)

Types are defined as zod schemas and inferred TypeScript types. IDs are ULIDs generated client-side so offline creation never collides.

### Workspace

- id, name, createdAt, updatedAt, isDemo (boolean), serverId (nullable), syncEnabled (boolean)

### Segment

- id, workspaceId, geometry (GeoJSON LineString, WGS84), lengthM, roadClass (A, B, C, U, unknown), setting (rural, urban), widthBand (lt1_5, 1_5_to_3, gt3), side (left, right, both, unknown), roadName (nullable), createdAt, updatedAt, deletedAt (tombstone, nullable), isDemo

### Observation

- id, segmentId, observedAt, forbCountBand (0, 1_2, 3_5, 6_9, 10_14, 15plus), indicatorIds (array of species ids), nutrientDominantIds (array), swardStructure (short_uniform, medium_mixed, tall_rank), cutState (uncut, cut_recent, unknown), cuttingsState (removed, left, na), lastCutMonth (1 to 12 or null), notes (nullable), photoIds (array, local only), scoringVersion, scoreResult (embedded: total, tier, breakdown, flags), createdAt, updatedAt, deletedAt, isDemo

### Photo (local only)

- id, observationId, blob, mime, width, height, createdAt

### Council (registry)

- id, name, type (county, unitary, district, other), region, createdAt, updatedAt

### CouncilFact

- id, councilId, key (ruralCutsPerYear, urbanCutsPerYear, firstCutMonth, cuttingsPolicy, designatedScheme, designatedCount, designatedLengthKm, other), value (typed by key), sourceUrl (required), sourceRetrievedAt (required), status (unverified, verified), submittedAt, reviewedAt (nullable)

### IndicatorSpecies (packages/data)

- id, commonName, scientificName, group (forb, legume, orchid, semi_parasite, grass_indicator, nutrient_enrichment), weight (1 to 3 for positive indicators, 0 for nutrient species), sensitive (boolean), notes, sourceUrl, sourceRetrievedAt, reviewStatus (needs_expert_review, reviewed)

### RegimeGuidance (packages/data)

- id, name, months, description, conditions, sourceUrls, sourceRetrievedAt

### ImpactCounters (server only)

- key (kmSurveyed, segmentsScored, segmentsFlagged, packsGenerated, requestsGenerated, activeWorkspaces), value, updatedAt

## 5\. Server schema (SQLite)

Tables: workspaces, segments, observations, tombstones, councils, council_facts, impact_counters, rate_limit_events.

Columns mirror section 4 with snake_case names. Additional workspace columns: edit_key_hash, edit_key_salt, created_ip_hash (salted hash, optional, purged after 30 days).

Indexes: segments(workspace_id, updated_at), observations(segment_id, updated_at), council_facts(council_id, key, status).

Migrations are SQL files applied in order with a small runner and a checksum table. Every migration is covered by a test that applies all migrations to an empty database.

## 6\. Sync protocol

- Each record has updatedAt (UTC ISO string) and deletedAt for tombstones.
- Client keeps a local lastSyncedAt per workspace.
- Push: POST /v1/workspaces/:id/sync with changed records since lastSyncedAt and the edit key in a header. Server applies last-write-wins per record by updatedAt, rejects records with updatedAt more than 5 minutes in the future, and returns server records changed since the supplied cursor.
- Pull is included in the same response. Client merges, writing any server-newer records locally.
- Demo records and photos are never sent.
- Sensitive taxa: the server stores precise geometry only if the workspace is private. Public registry or export endpoints never return it.

## 7\. API (v1)

All requests and responses are JSON. Errors use RFC 9457 problem details. All inputs are validated with zod and unknown fields rejected.

| Method and path                 | Purpose                                           | Auth                                   |
| ------------------------------- | ------------------------------------------------- | -------------------------------------- |
| GET /v1/health                  | Liveness and version                              | none                                   |
| POST /v1/workspaces             | Create workspace, return id and edit key once     | none, rate limited                     |
| POST /v1/workspaces/:id/sync    | Push and pull changes                             | edit key                               |
| GET /v1/workspaces/:id/export   | GeoJSON or CSV export                             | edit key                               |
| GET /v1/councils                | List councils with verified facts only by default | none                                   |
| GET /v1/councils/:id            | Council with facts and sources                    | none                                   |
| POST /v1/councils/:id/facts     | Propose a fact, enters unverified                 | none, rate limited                     |
| POST /v1/admin/facts/:id/review | Verify or reject a fact                           | admin key from env                     |
| POST /v1/impact/events          | Increment packsGenerated or requestsGenerated     | none, rate limited, strict body schema |
| GET /v1/impact                  | Public counters                                   | none                                   |

Security controls:

- Edit keys are 128-bit random, base32. Hash with scrypt and per-key salt. Constant-time compare.
- Rate limiting per IP hash and per route. Tight limits on writes.
- Request body size limit 1 MB.
- CORS allow-list from environment.
- Strict security headers: Content-Security-Policy with no inline scripts, Referrer-Policy no-referrer, X-Content-Type-Options nosniff, Permissions-Policy limiting geolocation to self.
- No secrets in the repo. .env.example only.

## 8\. Web app structure

```
apps/web/src/
  app/            routes, layout, providers
  features/
    survey/       steps, forms, state machine
    segments/     map, list, detail
    score/        score view, explanation
    advisor/      advisor form and output
    simulator/    which cut to drop
    registry/     browse, propose
    requests/     request builder
    pack/         evidence pack
    exports/      import and export
    impact/       impact page
    safety/       banners and acknowledgement
    demo/         demo workspace loader
  lib/            db (Dexie), api client, sync, pwa, geo helpers
  ui/             accessible primitives
```

State: local component state plus a small store (Zustand or React context). Server state is only the optional sync client.

## 9\. Accessibility and UX engineering rules

- Semantic HTML, labelled form controls, visible focus, skip link.
- Maps are never the only way to do something. Every map action has a form alternative (enter coordinates, pick from list).
- Colour is never the only carrier of meaning. Tier badges include text and icon.
- Respect prefers-reduced-motion and prefers-color-scheme.
- axe-core runs in Playwright on every main route.

## 10\. Testing strategy

| Level       | Tool                         | Target                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------- |
| Unit        | Vitest                       | core at or above 90 percent line coverage, golden fixtures for score and advisor |
| Property    | fast-check                   | geometry length, score monotonicity, simulator invariants                        |
| Integration | Vitest with in-memory SQLite | API routes and migrations                                                        |
| Component   | Vitest with Testing Library  | forms, steps, score view                                                         |
| E2E         | Playwright                   | survey to score to pack, offline mode, import and export                         |
| A11y        | axe-core in Playwright       | no serious or critical violations                                                |

Test names reference feature areas (for example survey, scoring, advisor, simulator).

## 11\. CI

Workflow on push and pull request: install with a lockfile, lint, typecheck, unit and integration tests with coverage thresholds, build, dependency audit (fail on high severity), licence check (fail on disallowed licences), Playwright on main. A second workflow deploys the static demo to GitHub Pages from main.

## 12\. Deployment

Option A: static demo (no API). Build apps/web with VITE_API_URL empty so it runs in local-only mode. Host on GitHub Pages or any static host. The app uses hash-free routes, so provide an SPA fallback.

Option B: Any static host.

- Static front end: upload the build output and include an `.htaccess` (or equivalent) with SPA fallback rewrite rules and long cache for hashed assets. See `deploy/static-hosting.md`.
- API: only if the host runs a persistent Node.js application. Otherwise stay in local-only mode and run the API elsewhere or defer sync.
- Keep core logic framework-agnostic so the app can be ported to another stack later if needed.

Option C: Docker for self-hosting the API and static front end behind a reverse proxy. Provide a Dockerfile and compose example.

## 13\. Observability and operations

- Structured JSON logs with request id. No personal data in logs.
- /v1/health returns version and database status.
- Nightly SQLite backup script documented in deploy docs.

## 14\. Decisions the agent must record in docs/DECISIONS.md

Each as a short ADR: stack confirmation, map library and tile policy, sync strategy, edit key scheme, photo storage policy, scoring thresholds as config, licence choices.
