# 05 - Commit Plan: 50 Commits to v0.1.0

Rules

* Each row is one real, atomic commit with working code or docs and passing checks.
* Follow the order. Commit messages are suggestions. Improve them if needed but keep Conventional Commits.
* If two steps naturally merge or one needs splitting, do it and record why in docs/DECISIONS.md. Total must stay between 40 and 50 and must reflect real work.
* Push after every 3 to 5 commits.
* Phase gates: do not start a phase until the previous phase's gate passes.

## Phase 0: Foundation (commits 1 to 9)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 1 | chore: initialise repository with MIT licence and base config | .gitignore, .editorconfig, .nvmrc, LICENSE (MIT, owner name, 2026), minimal package.json | git log shows clean root commit |
| 2 | docs: add specification pack and AGENTS.md | Copy docs 00 to 05 into docs/, add AGENTS.md at root, add docs/DECISIONS.md and docs/OPEN-QUESTIONS.md stubs | Files render in GitHub |
| 3 | docs: add initial README with problem, status and transparency note | Short README from doc 06, status: "in development", AI-assistance note | Links resolve |
| 4 | chore: scaffold npm workspaces for core, data, web and api | Workspace folders with package.json each | npm install succeeds |
| 5 | chore: add strict TypeScript base config and project references | tsconfig.base.json, per-package tsconfigs | npm run typecheck passes |
| 6 | chore: add ESLint flat config and Prettier | Lint and format scripts, ignore files | npm run lint passes |
| 7 | test: add Vitest and a first smoke test in core | Vitest config, coverage thresholds, one trivial test | npm test passes |
| 8 | ci: add GitHub Actions for lint, typecheck, test and build | .github/workflows/ci.yml | Workflow file valid, local scripts pass |
| 9 | chore: add husky, lint-staged and commitlint | Pre-commit and commit-msg hooks | Bad message is rejected locally |

Gate 0: CI green, hooks work, repo installs from scratch.

## Phase 1: Core domain (commits 10 to 18)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 10 | feat(core): add domain types and zod schemas | Workspace, Segment, Observation, Council, CouncilFact (doc 02) | Schema tests for valid and invalid inputs |
| 11 | feat(data): add indicator species data with schema and source fields | indicators.json (20 to 40 verified entries), JSON schema, validation test, docs/DATA.md | Every entry has sourceUrl and retrieval date |
| 12 | feat(core): implement verge-triage-v1 scoring engine | Pure function per doc 03, config from data | Golden fixtures A to E pass (SCO-1) |
| 13 | test(core): add score property tests and explanation generator | fast-check monotonicity, explanation text, confidence rules | Properties hold (SCO-2) |
| 14 | feat(core): implement cut-regime advisor | Regimes R1, RA, RB, RU and selection logic | Table-driven tests (ADV-1, ADV-2, ADV-3) |
| 15 | feat(core): add safety framing and refuge overlays to advisor | Overlays always applied, never drop safety cuts | Tests (ADV-4) |
| 16 | feat(core): implement which-cut-to-drop scenario simulator | Alignment table, rules 1 to 7, combinations | Four expected results from doc 03 pass (SIM-1, SIM-2) |
| 17 | feat(core): add FOI and EIR request generator | Template per doc 03 section 7 | All five items present, placeholders replaced (REQ-1, REQ-2) |
| 18 | feat(core): add geometry helpers and GeoJSON and CSV exporters | Haversine length, EXIF-free export, sensitive coarsening to 1 km | Length error under 1 percent, coarsening tested (SUR-1, EXP-1, EXP-3) |

Gate 1: core coverage at or above 90 percent. No browser dependencies in core.

## Phase 2: Web app shell and storage (commits 19 to 22)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 19 | feat(web): scaffold Vite React Tailwind app with routing and layout | Routes for all screens as placeholders, skip link | App builds and runs |
| 20 | feat(web): add accessible UI primitives | Button, Field, Select, Card, Tabs, Badge, Alert | Component tests, axe clean |
| 21 | feat(web): add Leaflet map component with configurable tiles and attribution | VITE_TILE_URL, attribution always visible, lazy loaded | Map renders, attribution test |
| 22 | feat(web): add Dexie storage layer and repositories | Workspaces, segments, observations, photos, tombstones | Repository integration tests with fake-indexeddb |

## Phase 3: Survey and results (commits 23 to 28)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 23 | feat(web): survey step 1, draw or locate a verge segment | Map drawing, GPS start point, coordinate entry alternative | Length rules enforced (SUR-1) |
| 24 | feat(web): survey step 2, verge attributes | Road class, setting, width, side, road name | Validation tests (SUR-2) |
| 25 | feat(web): survey step 3, indicators and photos | Checklist with images or descriptions, not-sure option, local photo capture, max 3 | Photos stored locally (SUR-3, SUR-4) |
| 26 | feat(web): survey step 4, cut state, sward and review | Save offline, compute score on save | Works with network disabled (SUR-3, SUR-5) |
| 27 | feat(web): score view with breakdown, flags and disclaimer | Tier badge with text and icon, explanation, what would change this | Exact disclaimer text shown (SCO-2, SCO-3, SCO-4) |
| 28 | feat(web): segment list and map view with tier filters | Filter, sort, delete with tombstone | Tests for filters |

Gate 3: a user can survey five segments offline and see scores.

## Phase 4: Decision tools (commits 29 to 34)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 29 | feat(web): cut-timing advisor page | Form, primary and fallback, sources shown | Matches core output (ADV-1, ADV-2) |
| 30 | feat(web): which cut to drop simulator page | Cut inputs, safety flags, results, presets labelled as illustrations, optional cost | Four doc 03 scenarios reproduced in UI tests (SIM-1 to SIM-4) |
| 31 | feat(web): council registry browse and search | Seed data from verified primary sources only, source shown next to each fact | Facts without source are rejected by schema (REG-1, REG-2, REG-4) |
| 32 | feat(web): registry contribution flow | Propose fact, local queue, export JSON for GitHub issue | Validation tests (REG-3) |
| 33 | feat(web): information request builder | Council picker, preview, copy, download, WhatDoTheyKnow link, not-legal-advice note | No network calls (REQ-1 to REQ-4) |
| 34 | feat(web): evidence pack builder with print stylesheet | HTML and Markdown export, A4 print CSS, demo watermark rule | Pack snapshot test (PCK-1 to PCK-3) |

## Phase 5: Data portability, offline, safety, demo (commits 35 to 38)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 35 | feat(web): import and export for GeoJSON and CSV | Validation with row-level errors | Round-trip test (EXP-1, EXP-2) |
| 36 | feat(web): PWA manifest, service worker and offline shell | Precache shell, capped tile cache | Offline Playwright test |
| 37 | feat(web): safety acknowledgement and sensitive taxa handling | First-run panel, per-survey reminder, sensitive notice and coarsening | Tests (SUR-6, SUR-7) |
| 38 | feat(web): demo workspace and onboarding tour | Synthetic segments, DEMO badge, excluded from export as real | Tests (DEM-1) |

Gate 5: full local-only product usable end to end.

## Phase 6: Optional API and sync (commits 39 to 44)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 39 | feat(api): scaffold Fastify service with config, health and error model | RFC 9457 errors, structured logs | Health test |
| 40 | feat(api): add SQLite schema and migration runner | Tables per doc 02, checksum table | Migrations apply to empty DB in test |
| 41 | feat(api): workspaces with hashed edit keys and sync endpoint | scrypt, constant-time compare, last-write-wins | Integration tests (SYN-1, SYN-2, SYN-4) |
| 42 | feat(api): council registry endpoints with review status | Propose and admin review | Tests (REG-3) |
| 43 | feat(api): impact counters and public impact endpoint | Increment events, aggregate only, excludes demo | Tests (IMP-2) |
| 44 | feat(web): optional sync client and impact page | Local-only fallback, conflict handling, honest empty state | Tests (SYN-3, IMP-1) |

## Phase 7: Quality, docs, release (commits 45 to 50)

| \# | Commit message | What to do | Check |
| --- | --- | --- | --- |
| 45 | test(e2e): add Playwright flows for survey to pack, offline and import | Main journeys | E2E green in CI |
| 46 | fix(a11y): resolve axe findings and document keyboard pass | axe on all main routes | No serious or critical issues |
| 47 | chore(security): add CSP, security headers, rate limits, audit and licence checks | CI jobs, header tests | Audit and licence jobs pass |
| 48 | docs: add METHOD, DATA, PRIVACY, ACCESSIBILITY and user guide | Reflect real behaviour, link sources | Links valid |
| 49 | chore(deploy): add Docker, Hostinger static deploy guide and Pages workflow | .htaccess SPA fallback, deploy docs, static demo deploy | Demo URL live |
| 50 | chore(release): finalise README and community files and tag v0.1.0 | README with screenshots, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, issue templates, CHANGELOG, HANDOFF, tag | Release created |

## After commit 50

1. Write docs/HANDOFF.md (if not already committed in 50, add as commit 51 only if the total stays honest and within the owner's request. Otherwise fold into 50).
2. Do not tag v0.1.0 until every release criterion in 01-prd section 13 passes.
3. Report to the owner: commit count, coverage numbers, open questions, unverified items, manual steps.

## What the human must do between commits

* Before commit 11: nothing.
* Before commit 31: confirm which council pages are acceptable as sources (agent proposes list).
* After commit 38: walk a real verge safely, record at least five real segments with the app, and keep them in a separate non-demo workspace. This is required for an honest application (see doc 07).
* After commit 48: ask an ecologist or Wildlife Trust volunteer to review docs/METHOD.md and the indicator list.