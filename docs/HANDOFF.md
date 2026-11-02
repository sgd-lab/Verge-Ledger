# Handoff — Verge Ledger v0.1.0 (quality stream)

Date: 2026-11-02. This handoff covers the final quality stream only
in its "changed" list; the feature streams that landed before it
(Survey/Workspaces/Impact/Demo, Export/Councils/Simulator/FOI, Fastify
API) are not re-described here except where a quality-stream check
touched them. Nothing was pushed to GitHub, no commits or tags were
created (this working copy has no `.git` directory), no real API keys
were used, no money was spent, and no council facts, species data,
ecologist review, pilot data, users or endorsements were invented.

## What the quality stream changed

- `apps/web/vite.config.ts` — PWA via `vite-plugin-pwa` (already a
  dependency): manifest (name "Verge Ledger", short name
  "Verge Ledger", theme `#065f46`, background `#f8fafc`, display
  `standalone`), app-shell precaching, and a runtime cache for
  OSM/CARTO map tiles (`map-tiles`, CacheFirst, max 50 entries,
  7-day expiry).
- `apps/web/index.html` — strict CSP as a meta tag (see "CSP" below)
  plus `theme-color`.
- `apps/web/src/App.tsx` — page routes converted to `React.lazy`
  with a Suspense fallback. Every route path and component is
  identical; only loading changed.
- `apps/web/src/components/ui/Dialog.tsx`, `Tabs.tsx` — **removed**.
  Verified by grep: no page imported them; only the barrel file did.
  Their exports were removed from
  `apps/web/src/components/ui/index.ts`, and their sections were
  removed from `apps/web/tests/ui/primitives.test.tsx`. They were not
  wired into a page, because that would have changed page behaviour
  the quality stream was told not to touch.
- `apps/web/tests/App.test.tsx` — updated to await the Suspense
  fallback (the only change needed for lazy routes).
- New tests: `apps/web/tests/pages.test.tsx` (Advisor, Simulator,
  Councils, Export, Workspaces, Impact, Home, NotFound),
  `apps/web/tests/survey-page.test.tsx` (survey→score via coordinate
  entry, edit/delete, map drawing toolbar),
  `apps/web/tests/interactions.test.tsx` (handler sweep across all
  pages), `apps/web/tests/hooks.test.tsx` (drawing, geolocation,
  drafts, segments, observations, sync status, photos),
  `apps/web/tests/map/map-components.test.tsx` (VergeMap,
  SegmentLayer, GpsMarker, DrawingToolbar, Leaflet mocked — the
  existing `apps/web/tests/setup.ts` pattern was followed),
  `apps/web/tests/seed.ts` (shared Dexie seeding helper, not a test).
- `e2e/tests/smoke.spec.ts` — replaced the stub (it exported a
  constant and contained no test) with 13 real Playwright tests:
  survey→score, advisor, simulator, evidence pack, import/export,
  and axe checks on `/`, `/survey`, `/advisor`, `/simulator`,
  `/councils`, `/export`, `/workspaces`, `/impact`.
- `playwright.config.ts` (repo root, new) — `testDir: e2e/tests`,
  Chromium project, webServer serving the production build with
  `vite preview` on port 4173. The root script `npm run test:e2e`
  (`playwright test`) now discovers these tests; previously there
  was no Playwright config at all, so that script could not have run
  them.
- `deploy/github-pages.md`, `deploy/hostinger-static.md` — guides
  only, no paid services (see below).
- `docs/HANDOFF.md` (this file), `CHANGELOG.md` (0.1.0
  [Unreleased]), `docs/OPEN-QUESTIONS.md` (OQ-5–OQ-11 appended;
  OQ-1–OQ-4 untouched), `docs/DATA.md` (§2–§3 corrected only).
- No changes were made to `packages/core`, `packages/data`,
  `apps/api`, any page's behaviour, `RootLayout`,
  `docs/DECISIONS.md`, or `vitest.config.ts` (no threshold lowered).

## What was verified (real numbers, measured 2026-11-02)

- `npm run lint` — pass, no warnings (`eslint . --max-warnings=0`).
- `npm run typecheck` — pass (`tsc --build`, including the e2e
  project).
- `npm test` — **184 tests passed, 22 files, 0 failed**, including
  the new page, map, hook and interaction tests added by this stream.
- `npm run test:coverage` — **pass, exit 0, no threshold errors**.
  Pattern aggregates computed from `coverage/coverage-final.json`
  (test files excluded): web `apps/web/src/**` — statements/lines
  ~90.5%, functions ~80.3%, branches ~76.6% (thresholds 70/70/65);
  core — ~99.4% lines, 100% functions, ~92.0% branches (thresholds
  90/90/85); API — ~82.3% lines, ~97.4% functions, ~71.5% branches
  (thresholds 70/70/65). Baseline before this stream was web
  34.4% lines / 50.4% functions / 61.9% branches — the web
  thresholds were failing then and pass now.
- `npm run build` (root, `tsc --build`) — pass.
- Web production build (`npm run build -w @verge-ledger/web`) —
  pass, after a local environment repair (see "Environment note").
  Output verified:
  - `apps/web/dist/manifest.webmanifest` — correct name, short
    name, theme/background colours, standalone display.
  - `apps/web/dist/sw.js` + `workbox-*.js` — generated; precache
    **31 entries (770.29 KiB)**; runtime route for
    `tile.openstreetmap.org` / `*.basemaps.cartocdn.com` with
    CacheFirst, `map-tiles`, `maxEntries: 50`,
    `maxAgeSeconds: 604800`.
  - `apps/web/dist/registerSW.js` — registers `/sw.js`.
  - `apps/web/dist/index.html` — contains the CSP meta tag.
  - Served build check (`vite preview`, port 4173): `/` → 200,
    `/manifest.webmanifest` → 200, `/sw.js` → 200, `/survey`
    (SPA route) → 200, and the served root HTML contains
    "Verge Ledger". The CSP meta tag did not prevent the served
    build from responding; note that a real browser CSP check
    (tiles/fonts rendering under the policy) still needs the
    browser run in "Unverified" below.
- **Bundle size (initial route, gzipped, measured with `gzip -c`):**
  entry JS `index-0_*.js` 363,049 B raw / **114,703 B gzip**,
  CSS 27,324 B raw / 5,448 B gzip, plus the lazy HomePage chunk
  ~3.1 kB gzip — **≈ 120 KiB gzipped for the initial route**, which
  **meets** the PRD 200 kB gzipped initial-route target on this
  measurement. Lazy per-page chunks are separate (e.g. SurveyPage
  200,412 B raw / 62,708 B gzip, loaded only on `/survey`).
  Total `apps/web/dist` is 3.9 MB, mostly `.map` sourcemaps
  (sourcemaps are enabled in the pre-existing Vite config).

## CSP + security headers (what was done, and its limit)

- Static build: meta CSP in `index.html` —
  `default-src 'self'; script-src 'self'; style-src 'self';
style-src-attr 'unsafe-inline'; img-src 'self' data:
https://tile.openstreetmap.org https://*.basemaps.cartocdn.com;
font-src 'self'; connect-src 'self'; worker-src 'self';
manifest-src 'self'; object-src 'none'; base-uri 'self';
form-action 'self'; frame-ancestors 'none'`.
  `style-src-attr 'unsafe-inline'` is deliberate: Leaflet positions
  map panes with inline styles. No inline `<script>`/`<style>` is
  used by the bundled app. If `VITE_API_URL` ever points at a real
  API origin, that origin must be added to `connect-src`.
- Real headers are **not** settable from this repo on GitHub Pages,
  and the meta tag cannot set HSTS, `X-Content-Type-Options`,
  `Referrer-Policy` or `Permissions-Policy`. The deploy guides
  document the exact header versions to send on a host that supports
  them (Hostinger `.htaccess` example included).

## Deploy guides (summary)

- `deploy/github-pages.md`: the existing Pages workflow builds with
  `VITE_API_URL=''` (local-only). SPA fallback is **not** in the
  workflow yet — the guide documents adding an `index.html` →
  `404.html` copy step; until then, share only the site root, not
  deep links.
- `deploy/hostinger-static.md`: upload `apps/web/dist` contents,
  `.htaccess` SPA fallback (real files served directly), long cache
  (1 year) for hashed `assets/` only with `no-cache` for
  `index.html`/`manifest.webmanifest`/`sw.js`, header versions of
  the CSP + HSTS etc., and the API only if the plan runs Node
  persistently — with the warning that the v0.1.0 API is in-memory
  only (ADR-009).

## What is UNVERIFIED (do not claim otherwise)

- **E2E and axe: NOT RUN.** `npx playwright test --list` discovers
  all 13 tests, but `npm run test:e2e` fails at browser launch in
  this VM: `Executable doesn't exist at
~/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`
  (`~/.cache/ms-playwright` does not exist). All 13 tests fail at
  launch, before any page loads — this says nothing about the app
  or the specs, good or bad. The specs are written against the
  current page labels/buttons, but axe results (especially on the
  map-heavy `/survey` route) are unknown until a browser run.
  See OQ-9.
- **Browser CSP rendering check:** the served build responds, but
  whether Leaflet tiles and fonts render under the meta CSP in a
  real browser, and whether the service worker actually installs and
  serves the precache offline, were not observed (no browser here).
- **Production tile provider, ecologist review, pilot survey, API
  SQLite persistence, Pages SPA fallback, v0.1.0 tag:** all deferred
  to the owner (below).

## Environment note (local repair, not a repo change)

The first web build after adding the PWA plugin failed in
`vite-plugin-pwa`'s service-worker generation with
`Dynamic require of "workbox-build" is not supported`. Root cause
was this VM's `node_modules`, not the repo: `caniuse-lite` (a
transitive dependency of `workbox-build` via browserslist) was
missing entirely, so `import('workbox-build')` threw. It was repaired
with `npm install --no-save caniuse-lite` (node_modules only;
`package.json` unchanged, `package-lock.json` already listed
caniuse-lite as a transitive dependency). A fresh `npm ci` (as CI
does) should include it; if a future build hits the same error on a
fresh checkout, that points at the lockfile/install, not at the PWA
config.

## What the owner must do by hand

1. **Ecologist review (OQ-2, OQ-5):** arrange a named ecologist /
   Wildlife Trust botanist review of indicator weights, regimes and
   advice text; record it in `docs/DECISIONS.md`. Until then, never
   describe scores as expert-validated.
2. **Real pilot survey (OQ-3, OQ-6):** walk a live survey with a
   participating parish council, generate the first real evidence
   pack, and record the outcome. Demo/seeding fixtures are not pilot
   data.
3. **Production tile provider (OQ-1, OQ-7):** choose a provider
   (e.g. Stadia Maps, Jawg, self-hosted PMTiles) and set
   `VITE_TILE_URL`; OSM standard tiles are dev/demo only.
4. **API SQLite persistence (OQ-8):** replace the in-memory store
   (`apps/api/src/store.ts`) with the SQLite shapes already declared
   in its `SCHEMA_SQL` before any production API use; also set
   `VERGE_ADMIN_KEY` if the API is deployed at all.
5. **Run e2e + axe with browsers (OQ-9):** `npx playwright install
--with-deps chromium` then `npm run test:e2e` from the repo root;
   fix any serious/critical axe findings (minimal markup fixes) and
   only then claim an e2e/axe pass.
6. **Pages SPA fallback (OQ-10):** add the `404.html` copy step from
   `deploy/github-pages.md` to the Pages workflow and verify a
   refreshed `/survey` URL.
7. **v0.1.0 tag (OQ-11):** create the git tag by hand after
   confirming the gates above (the quality stream was told not to
   create it, and this copy has no `.git` directory).
8. **Host headers (if leaving GitHub Pages):** apply the header set
   in `deploy/hostinger-static.md` on the chosen host.

---

## Update — 2026-11-02 (after the quality stream, pushes to GitHub)

- Pushed to `sgd-lab/Verge-Ledger` main: `93a3a8f632f17589a3076b5474cbbac415130723` (survey/advisor/simulator/councils/export + map fixes) and `f8256dbe51a26f3b52b99fc8efdf1f5580c778c9` (full v0.1.0 scope: photos, drafts, import, demo, registry search, presets, FOI download, evidence-pack formats, workspaces, impact, Fastify API, PWA, coverage). The earlier statement in this file that "nothing was pushed" applied only to the quality stream's working copy at that time and is superseded by these pushes.
- README replaced with the owner's updated README (2026-11-02), with only factual corrections: real clone URL, WCAG badge worded as a target (axe run pending, OQ-9), API described as in-memory rather than SQLite (OQ-8), data/deploy folders described as they actually are, and PDF described as via browser print.
- Still pending deletion on GitHub (see OQ-12): `apps/web/src/components/ui/Dialog.tsx` and `Tabs.tsx` (removed locally, still orphaned on main because the push tool cannot delete files), `docs/AGENT_HANDOFF_PLAN.md` (superseded by this file), and `FRONTEND_AUDIT_REPORT.md` (superseded by this file and CHANGELOG; it also still says nothing was pushed).
