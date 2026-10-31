# Verge Ledger v0.1.0 — Agent Handoff & Continuity Plan

**Target Repository**: [https://github.com/sgd-lab/Verge-Ledger](https://github.com/sgd-lab/Verge-Ledger)  
**Local Workspace**: `d:\new project for h\verge-ledger`  
**Active Branch**: `main` (tracked to `origin/main`)  
**Latest Certified Commit**: `8ea8420 fix(core): align orchid override, add Helmert transform, fix Fixture E`  
**Current Milestone State**:

- **Milestone 1 (Phase 0 Foundation)**: 100% COMPLETE — Gate 0 Certified PASS.
- **Milestone 2 (Phase 1 Core Domain Logic & Verified Data)**: 100% COMPLETE — Gate 1 Certified PASS.
- **Milestone 3 (Phase 2 Web Shell, Storage & Map)**: READY TO BEGIN (Commits 19–26).
- **Subagents Status**: ALL SUBAGENTS STOPPED cleanly.

---

## 1. Executive Summary & Production Status

All code in `packages/core` and `packages/data` through Phase 1 is completed, fully tested, and certified:

- **Test Pass Rate**: **104 / 104 tests passing (100%)** across 9 test suites in `packages/core` and `packages/data`.
- **Code Coverage in `packages/core`**:
  - **Line Coverage**: **99.41%** (exceeds $\ge 90\%$ gate requirement)
  - **Branch Coverage**: **91.97%** (exceeds $\ge 85\%$ requirement)
- **TypeScript Compilation**: `tsc --build` passes cleanly with **0 errors**.
- **Linter & Formatting**: ESLint 9 flat configuration passing with **0 errors and 0 warnings**.
- **Domain Purity**: Zero DOM or network dependencies in `packages/core`.

---

## 2. Completed Work Inventory (Phase 0 & Phase 1)

### Phase 0: Monorepo Foundation & Tooling (Gate 0 Certified PASS)

1. **Commit 1 (`2311afc`)**: `chore: initialise repository with license and base configs` (MIT License 2026 Verge Ledger Contributors, .gitignore, editorconfig).
2. **Commit 2 (`467f49b`)**: `docs: import specification pack and add AGENTS.md` (all 7 specification docs imported in `docs/`).
3. **Commit 3 (`2e8a8f1`)**: `docs: add community files and issue templates` (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, GitHub templates).
4. **Commit 4 (`4020263`)**: `chore: configure npm workspaces for packages and apps` (`packages/core`, `packages/data`, `apps/web`, `apps/api`, `e2e`).
5. **Commit 5 (`a83f9b0`)**: `chore: configure TypeScript project references and strict mode` (composite references, tsconfig.base.json, zero `any`).
6. **Commit 6 (`0069276`)**: `chore: add ESLint flat config and Prettier` (ESLint 9 flat config, boundary isolation, Prettier 3).
7. **Commit 7 (`a055a8d`)**: `test: add Vitest and a first smoke test in core` (Vitest runner with coverage configured).
8. **Commit 8 (`ea91576`)**: `ci: add GitHub Actions for lint, typecheck, test and build` (CI matrix for Node 20 and 22).
9. **Commit 9 (`ee2b202`)**: `chore: add husky, lint-staged and commitlint` (Conventional Commit validation, lint-staged hooks).

### Phase 1: Core Domain Logic & Verified Data (Gate 1 Certified PASS)

10. **Commit 10 (`10f62d7`)**: `feat(core): define domain models and Zod schemas` (runtime-validated Zod schemas for verges, segments, observations, species, regimes, and simulations).
11. **Commit 11 (`de6447d`)**: `feat(core): implement verge-triage-v1 pure scoring engine` (`verge-triage-v1` scoring algorithm: Botanical Richness, Indicator Species weighting, Sward Structure, Negative Invasives penalty, Orchid override rule, and confidence ratings).
12. **Commit 12 (`4fe3b95`)**: `test(core): add Golden Fixtures A through E verification` (Golden Fixtures A–E test suite matching specification 03 exact expected values).
13. **Commit 13 (`6f1f6b0`)**: `feat(core): implement cut-regime advisor` (`verge-advice-v1` regime selection R1/RA/RB/RU, safety sightline 1.0–1.2m overlays, wildlife corridors, cutter-bar height guidance).
14. **Commit 14 (`b2bfcb0`)**: `feat(core): implement which-cut-to-drop scenario simulator` (carbon footprint, mowing costs, fuel consumption, biodiversity trajectory, safety constraint locking).
15. **Commit 15 (`0babab7`)**: `feat(core): add FOI and EIR request generator` (statutory inquiry generator under Environmental Information Regulations 2004 Reg 5 and FOIA 2000 with 20-working-day deadline).
16. **Commit 16 (`f59d1c8`)**: `feat(data): curate verified indicator species dataset` (36 botanical indicator taxa with verified provenance URLs, retrieval dates, and Plantlife/BSBI mapping).
17. **Commit 17 (`0c8bed5`)**: `feat(core): implement haversine and sensitive taxa grid coarsening` (pure Haversine distance, segment bounds validation, and sensitive orchid/taxa 1km/10km hectad blurring).
18. **Commit 18 (`63d249b`)**: `feat(core): implement GeoJSON and CSV export helpers` (RFC 7946 GeoJSON FeatureCollection generator and RFC 4180 CSV export helpers with EXIF privacy stripping).
19. **Gate 1 Hardening Commits**:
    - `916f15c test(core): improve branch coverage across domain modules`
    - `4a271e0 fix(core): ensure options savings adhere to schema and tests pass`
    - `8ea8420 fix(core): align orchid override, add Helmert transform, fix Fixture E` (full 7-parameter Helmert datum transformation WGS84 $\rightarrow$ OSGB36 tested against Trafalgar Square benchmark TQ3080, orchid tier preservation, subscore clamping).

---

## 3. Remaining Implementation Roadmap (Commits 19 to 50)

### Phase 2: Web Shell, Storage & Map (Commits 19–26 & Gate 2) — NEXT TO IMPLEMENT

- **Commit 19**: `feat(web): initialise Vite React Tailwind app shell`
  - Setup Vite + React 18/19 + Tailwind CSS in `apps/web`.
- **Commit 20**: `feat(web): add accessible design tokens and UI primitives`
  - WCAG 2.2 AA compliant components (touch targets $\ge 44 \times 44$ px, color contrast ratios $\ge 4.5:1$, visible focus rings, ARIA landmarks).
- **Commit 21**: `feat(web): integrate Leaflet with open tile providers`
  - Leaflet integration with OpenStreetMap / Ordnance Survey Open Zoomstack, GPS accuracy circle, compulsory visible attribution, and accessible non-map entry fallback.
- **Commit 22**: `feat(web): add Dexie local database for segments and observations`
  - IndexedDB storage with Dexie (`VergeLedgerDB`), ULID generation, React reactive hooks.
- **Commit 23**: `feat(web): implement offline sync queue and state machine`
  - Offline sync state machine (`idle`, `pending`, `syncing`, `failed`), local queue persistence.
- **Commit 24**: `feat(web): add PWA manifest, service worker and install prompt`
  - Offline caching service worker, web manifest, install banner.
- **Commit 25**: `test(web): add unit tests for Dexie stores and sync machine`
- **Commit 26**: `test(e2e): scaffold Playwright tests for app shell`
- **Gate 2 Verification**: Web app builds and boots completely offline; PWA manifest valid; e2e smoke passes.

### Phase 3: Five-Minute Survey Flow (Commits 27–34 & Gate 3)

- **Commits 27–30**: 4-step mobile survey wizard (Step 1 GPS/draw segment, Step 2 verge attributes, Step 3 indicator species checklist with photo capture, Step 4 sward height & cut status).
- **Commit 31**: Real-time triage score calculation in UI.
- **Commit 32**: Offline survey persistence in IndexedDB.
- **Commits 33–34**: Vitest component tests & Playwright offline e2e tests.
- **Gate 3 Verification**: 5-minute survey runs 100% offline with network disabled.

### Phase 4: Advisor, Simulator & Printable Evidence Pack (Commits 35–40 & Gate 4)

- **Commit 35**: Cut-Regime Advisor interactive UI.
- **Commit 36**: "Which Cut to Drop?" Scenario Simulator UI.
- **Commit 37**: One-page printable evidence pack (clean print CSS / PDF export).
- **Commit 38**: Statutory EIR/FOI letter generator UI with copy-to-clipboard & mailto.
- **Commits 39–40**: Visual regression tests and export validation.
- **Gate 4 Verification**: Evidence pack renders cleanly on a single printed page.

### Phase 5: Council Registry, Public View & API (Commits 41–45 & Gate 5)

- **Commit 41**: `apps/api` lightweight Fastify/Hono API.
- **Commit 42**: Council registry search and filter by parish/district/county.
- **Commit 43**: Public verge explorer map.
- **Commit 44**: Synthetic demonstration data clearly marked `[DEMO]`.
- **Commit 45**: API contract test suite.
- **Gate 5 Verification**: Demo data tagged and excluded from metrics; registry filters functional.

### Phase 6: Polish, Accessibility & Release (Commits 46–50 & Gate 6)

- **Commit 46**: Performance optimization (Lighthouse 90+ across performance, a11y, best practices).
- **Commit 47**: WCAG 2.2 AA accessibility audit and fixes.
- **Commit 48**: Final documentation (user manual, screenshots, deployment guides).
- **Commit 49**: Comprehensive end-to-end smoke test suite passing.
- **Commit 50**: `chore(release): bump version to 0.1.0 and write docs/HANDOFF.md`.
- **Gate 6 Verification**: Complete 50-commit sequence verified, clean working tree, production release ready.

---

## 4. Instructions for Upcoming Agent

When resuming work:

1. **Environment Setup (Windows PowerShell)**:
   - Git binary path: `& "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"`
   - Node / npm: Use `npm.cmd`
2. **Repository Directory**:
   - `d:\new project for h\verge-ledger`
3. **Pre-Flight Health Check**:
   ```powershell
   cd "d:\new project for h\verge-ledger"
   npm.cmd run typecheck
   npm.cmd test
   npm.cmd run lint
   ```
4. **Resuming Implementation**:
   - Start immediately with **Commit 19**:
     `feat(web): initialise Vite React Tailwind app shell` in `apps/web`.
   - Proceed sequentially through Commits 20–26.
5. **Quality Invariants**:
   - Every commit must follow Conventional Commits formatting.
   - Maintain 0 TypeScript errors and 0 ESLint errors across all packages.
   - Keep domain pure: `packages/core` must not import web, DOM, or storage packages.
