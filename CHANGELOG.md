# Changelog

All notable changes to Verge Ledger are documented here. This project
follows no formal release process yet; versions below are the
`package.json` versions of the workspaces.

## 0.1.0 — [Unreleased]

This entry covers the whole v0.1.0 completion effort: the Survey,
Workspaces, Impact and Demo stream; the Export, Councils, Simulator
and FOI stream; the Fastify API stream; and the final quality stream
(PWA, code-splitting, coverage, e2e, CSP, deploy guides, handoff).
No v0.1.0 git tag exists yet — creating it is an owner action
(see `docs/HANDOFF.md` and `docs/OPEN-QUESTIONS.md` OQ-11).

### Added

- **Survey (offline-first, local-only):** five-minute verge survey with
  map drawing (Leaflet, canvas rendering), manual coordinate entry as
  the non-map alternative, GPS marker, segment create/edit/soft-delete,
  observations with triage scoring, draft resume/discard, safety
  acknowledgement, and local photo storage with EXIF stripping.
- **Workspaces:** create, rename, set-active and delete workspaces,
  stored locally in IndexedDB (Dexie).
- **Impact:** local-only counters computed from on-device data only —
  verge length surveyed, segments scored, segments flagged for expert
  review, evidence packs generated, councils with a cited source,
  information requests generated, active workspaces. Demo data is
  excluded from every counter.
- **Demo workspace:** synthetic, clearly labelled demo segments
  shaped like scoring fixtures A–E, loadable from the home page,
  excluded from impact counters, sync and real evidence packs.
- **Cut-Timing Advisor:** regime recommendations (R1, RA, RB, RU)
  from a scored verge, with safety disclaimers and fallback regimes.
- **Simulator:** "which cut should we drop" scenario ranking with
  illustrative presets, safety-critical cut locking, and optional
  cost/fuel/length savings inputs.
- **Councils & FOI:** local council-fact registry (starts empty — no
  council facts are pre-filled or invented), proposal queue with JSON
  export, and a Freedom of Information / Environmental Information
  request-letter builder. Letters are generated locally; nothing is
  sent by the page.
- **Export & evidence packs:** GeoJSON and CSV export (sensitive
  taxa locations coarsened to a 1 km grid), evidence-pack generation
  (HTML/Markdown/print, DEMO-watermarked for demo selections), and
  GeoJSON/CSV import with per-row validation and error reporting.
- **Optional Fastify API (`apps/api`):** workspace sync
  (last-write-wins with tombstones), council-fact proposals (always
  `unverified` until reviewed), and aggregate impact counters, with
  zod validation, RFC 9457-style problem errors, and scrypt-hashed
  edit keys returned exactly once at creation. **Honest limitation:
  the API store is in-memory, not SQLite** (ADR-009 in
  `docs/DECISIONS.md`): data does not survive an API restart, and
  SQLite persistence is deferred (OQ-8). The web app works fully
  without the API; with `VITE_API_URL` empty it runs in local-only
  mode.
- **PWA (quality stream):** `vite-plugin-pwa` manifest (name
  "Verge Ledger", standalone display, emerald theme colour), app-shell
  precaching (31 entries in the measured build), service-worker
  registration, and a runtime cache for OSM/CARTO map tiles capped at
  50 entries / 7 days.
- **Code-splitting (quality stream):** every page route in
  `apps/web/src/App.tsx` is `React.lazy` behind a Suspense fallback;
  route paths and components are unchanged.
- **Security headers (quality stream):** a strict
  Content-Security-Policy as a meta tag in the static build (tiles,
  fonts and bundled app verified working from the served build), plus
  deploy guides documenting that real HTTP headers must be set by the
  host — GitHub Pages cannot apply custom headers from the repo.
- **Deploy guides (quality stream):** `deploy/github-pages.md`
  (SPA fallback via `404.html`, local-only build) and
  `deploy/static-hosting.md` (static upload, `.htaccess` SPA
  fallback, long cache for hashed assets only, optional Node API).
- **Tests (quality stream):** unit/integration coverage raised to the
  existing thresholds, including Survey, Advisor, Simulator, Councils,
  Export, Workspaces, Impact and Home pages, map components
  (VergeMap, SegmentLayer, GpsMarker, DrawingToolbar with Leaflet
  mocked), hooks, repositories and the demo/workspaces/impact code
  paths; and a real Playwright spec (`e2e/tests/smoke.spec.ts`) with
  survey→score, advisor, simulator, evidence-pack and import/export
  flows plus axe checks on all main routes.
- **Documentation (quality stream):** `docs/HANDOFF.md`,
  `docs/OPEN-QUESTIONS.md` (OQ-5–OQ-11), and a corrected
  `docs/DATA.md` (regimes live in core constants, council registry
  starts empty, indicators are the 37-entry sourced dataset).

### Changed

- Unused UI components `Dialog` and `Tabs` were removed
  (no page imported them; their barrel exports were removed too)
  rather than left as dead code. Their unit tests were removed
  alongside them; the remaining primitives are still tested.
- The existing App shell test was updated to await the Suspense
  fallback introduced by lazy routes; no route behaviour changed.

### Known limitations (not fixed in this release)

- No ecologist review of indicator weights or advice text (OQ-2, OQ-5).
- No real pilot survey has been run (OQ-3, OQ-6).
- Production tile provider not chosen; OSM standard tiles are
  dev/demo only (OQ-1, OQ-7).
- API data is in-memory only (OQ-8).
- E2E/axe could not be run in the build VM (no Chromium installed);
  see OQ-9. Do not treat the e2e spec as passing until it runs green
  with browsers installed.
- GitHub Pages SPA fallback (`404.html`) is documented but not yet
  added to the Pages workflow (OQ-10).
- The v0.1.0 tag is not created (OQ-11).

## [Unreleased]
## [Unreleased] — GitHub Pages demo setup 2026-11-02

- Pages build fixed for the project subpath: workflow builds with `VITE_PAGES_BASE='/Verge-Ledger/'`, Vite base + PWA manifest + router basename all use it, `404.html` SPA fallback is copied in the workflow (OQ-10 code fix), and `.nojekyll` is shipped via `apps/web/public/`.
- README now links the live demo `https://sgd-lab.github.io/Verge-Ledger/` (goes live once Pages is enabled in repo Settings — see `deploy/github-pages.md`).
- Still manual, repo cannot do it: make the repo public on a Free plan and set Settings > Pages > Source to GitHub Actions.

## [Unreleased] — docs cleanup 2026-11-02

- Kept only the docs actually needed: `README.md`, `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `docs/02-architecture.md`, `docs/03-method-and-rules.md`, `docs/DATA.md`, `docs/DECISIONS.md`, `docs/OPEN-QUESTIONS.md`, `docs/PRIVACY.md`, `docs/ACCESSIBILITY.md`, `deploy/github-pages.md`, `deploy/static-hosting.md`.
- Deleted from the repo: `docs/00-research-brief.md`, `docs/01-prd.md`, `docs/04-agent-master-instructions.md`, `docs/05-commit-plan.md`, `docs/06-repo-launch-files.md`, `docs/METHOD.md`, `docs/HANDOFF.md`, `docs/AGENT_HANDOFF_PLAN.md`. Kept docs were updated so they no longer reference the deleted files; requirement IDs from the old PRD are no longer defined in the repo (test names still carry feature-area names).
- `docs/OPEN-QUESTIONS.md` OQ-12 marked RESOLVED (orphan files deleted from GitHub).
 — docs refresh 2026-11-02

- README replaced with the owner's updated README, with factual corrections only: real `sgd-lab/Verge-Ledger` clone URL, WCAG badge as a target (axe run pending), API as in-memory rather than SQLite, data/deploy folders as they actually are, PDF via browser print.
- `docs/HANDOFF.md` updated with the two GitHub pushes (`93a3a8f…`, `f8256dbe…`) and the pending-deletion list (OQ-12).
- `docs/OPEN-QUESTIONS.md`: added OQ-12 (orphan/stale files pending deletion on GitHub).
- `docs/ACCESSIBILITY.md`: conformance is a target, not yet verified (axe run pending, OQ-9); survey described as a single-page form, not a multi-step wizard.
