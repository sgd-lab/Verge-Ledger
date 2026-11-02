# 🌿 Verge Ledger

**Defensible roadside ecology evidence and deterministic cut-timing tools for parish councils and volunteer surveyors in England.**

[![Version](https://img.shields.io/badge/version-0.1.0-1b4332.svg?style=flat-square)](#)
[![Architecture](https://img.shields.io/badge/architecture-offline--first_PWA-2d6a4f.svg?style=flat-square)](#)
[![Accessibility](https://img.shields.io/badge/WCAG-2.2_AA_target-40916c.svg?style=flat-square)](docs/ACCESSIBILITY.md)
[![License: MIT](https://img.shields.io/badge/code-MIT-52b788.svg?style=flat-square)](LICENSE)
[![Data: CC BY 4.0](https://img.shields.io/badge/data_%26_docs-CC_BY_4.0-74c69d.svg?style=flat-square)](#licence--attribution)

[Documentation](docs/) · [Methodology & Heuristics](docs/METHOD.md) · [Data & Citations](docs/DATA.md) · [Report an Issue](../../issues)

> **Status (`v0.1.0`):** Full offline-first progressive web application and domain toolkit. The `verge-triage-v1` scoring heuristics act as a rapid volunteer triage aid and await formal calibration by a reviewing ecologist.

---

## 🌾 The Challenge & Overview

Road verges across Great Britain span approximately $2,579\text{ km}^2$—harbouring over 700 wildflower species at a time when the UK has lost roughly $97\%$ of its traditional wildflower meadows since the 1930s. How these corridors are mown determines whether they thrive as linear meadows or degrade into rank, nutrient-heavy grass.

Published ecological guidance (such as Plantlife's *Good Verge Guide*) demonstrates that delaying cuts until late summer and removing clippings dramatically improves botanical richness. However, a persistent gap exists between ecological guidance and local highway maintenance:

1. **No Rapid Field Standard:** Volunteers and parish clerks lack a quick, consistent way to log what a verge holds without requiring specialist GIS software or years of ecological training.
2. **The Budget Reduction Dilemma:** When county or unitary authorities propose cutting maintenance budgets (for example, dropping one annual rural cut), parishes have no transparent tool to evaluate *which* cut can be removed with the least ecological harm while strictly preserving road safety.
3. **Fragmented Public Records:** Highway cutting schedules, clippings policies, and designated roadside nature reserve lists are rarely published in a standardised, comparable format.

**Verge Ledger** bridges this gap. It enables a parish council or community wildlife group to move from *"we think this verge is special"* to a **sourced, A4-printable evidence pack** and a **statutory information request** in under 60 minutes—entirely from a mobile phone, with zero mobile signal required.

### Who This Is Built For

* **Parish Clerks & Councillors:** Generate concise, source-cited briefing packs for county highway officers or local mowing contractors, and evaluate budget-reduction scenarios transparently.
* **Volunteer Surveyors & Community Groups:** Record 5-minute roadside observations offline using plain-English indicator checklists, receiving immediate triage feedback.
* **Wildlife Trusts & Biological Record Centres:** Receive clean, standardised exports (`GeoJSON` and `CSV`) that flag promising sites for professional surveyor visits while automatically protecting sensitive species coordinates.

### Explicit Boundaries (What Verge Ledger Does *Not* Do)

* **Not an AI Species Identifier:** It uses zero machine learning or photo recognition. It relies on deterministic rules and a curated checklist of recognisable roadside indicator species.
* **Not an Official Designation:** A high score does not designate a Local Wildlife Site (LWS) or replace a professional Phase 1 / UKHab ecological survey.
* **Never Overrides Road Safety:** Visibility splays, junction sightlines, and bend clearances take absolute priority over every ecological recommendation.
* **Not a BNG Calculator:** It does not compute statutory Biodiversity Net Gain metrics for planning applications.

---

## 🧭 Operational Workflow & Methodology

Verge Ledger operates as a deterministic pipeline. Every point awarded, management flag raised, and regime recommended is traceable to an explicit rule in `@verge-ledger/core` and a cited primary source in `@verge-ledger/data`.

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│  1. Field Survey   │ ──▶ │  2. Triage Engine  │ ──▶ │ 3. Regime & Cut    │ ──▶ │  4. Evidence Pack  │
│  (Offline Mobile)  │     │  (verge-triage-v1) │     │    Simulation      │     │  & FOI/EIR Request │
└────────────────────┘     └────────────────────┘     └────────────────────┘     └────────────────────┘
  • GPS / Map Line           • Richness (0–40)          • Regimes R1, RA,          • A4 Print Layout
  • 10m Forb Count           • Indicators (0–30)          RB, RU + Overlays        • GeoJSON / CSV
  • Indicator Species        • Structure (0–15)         • 12-Month Alignment       • 1km Coarsening
  • Sward & Cut State        • Nutrient Penalty           Drop Simulator           • Statutory Letter
```

### 1. Four-Step Field Survey
Designed for one-handed use in daylight with zero network dependency:
* **Step 1 — Geometry & Context:** Draw a segment on the interactive map, capture live GPS start/end points, or enter coordinates manually. Enforces a valid segment length between $5\text{ m}$ and $500\text{ m}$ via Haversine validation, alongside road class (`A`, `B`, `C`, `Unclassified`), setting (`Rural`, `Urban`), and verge width band.
* **Step 2 — Physical Attributes:** Log sightline constraints, footway presence, slope, and canopy shade.
* **Step 3 — Botanical Checklist & Media:** Record the count band of flowering wildflower species seen in a $10\text{ m}$ sample ($0$ to $15+$), tick positive indicator species (weighted $1$ to $3$), and mark dominant nutrient-enrichment species (such as nettle, cow parsley, hogweed, or cleavers). Attach up to 3 local photos (stored strictly on-device with automatic EXIF metadata stripping).
* **Step 4 — Sward Structure & Mowing State:** Record sward height/structure (`short_uniform`, `medium_mixed`, `tall_rank`), current cut status, and whether clippings are collected or left as mulch.

### 2. Deterministic Triage Engine (`verge-triage-v1`)
Observations are evaluated by a pure functional scoring engine that computes four transparent sub-components:

* **Richness ($R \in [0, 40]$):** Derived from the distinct flowering forb species count band within a $10\text{ m}$ sample ($0 \to 0\text{ pts}$, $1\text{–}2 \to 8\text{ pts}$, $3\text{–}5 \to 18\text{ pts}$, $6\text{–}9 \to 28\text{ pts}$, $10\text{–}14 \to 35\text{ pts}$, $15+ \to 40\text{ pts}$).
* **Positive Indicators ($I \in [0, 30]$):** Sums the ecological selectivity weights ($w \in \{1, 2, 3\}$) of distinct positive indicator species observed:
  $$I = \text{round}\left(30 \times \frac{\min(\sum w, 10)}{10}\right)$$
* **Sward Structure ($S \in [0, 15]$):** Awards $15\text{ pts}$ for a varied `medium_mixed` sward, $8\text{ pts}$ for `short_uniform`, and $3\text{ pts}$ for `tall_rank`.
* **Nutrient Penalty ($N \in [0, 20]$):** Deducts $7\text{ pts}$ per dominant competitive/nutrient-enrichment species observed, capped at $20\text{ pts}$:
  $$N = \min(20, 7 \times \text{count})$$

The raw positive score ($\text{Raw} = R + I + S$, maximum $85$) is normalised and penalised to produce the final score:

$$\text{Score} = \text{clamp}\left(\text{round}\left(\frac{100 \times (R + I + S)}{85}\right) - N,\; 0,\; 100\right)$$

#### Triage Tiers & Safety Overrides
| Score Range | Triage Tier | Operational Meaning |
| :--- | :--- | :--- |
| **0 – 29** | **Ordinary verge** | Standard management applies; suitable for general restoration regimes if cuttings can be collected. |
| **30 – 59** | **Promising verge** | Shows clear botanical potential; benefits from late-summer hay-meadow cut timing. |
| **60 – 100** | **Refer for expert review** | High indicator diversity; share evidence pack with local Wildlife Trust or biological record centre. |

* **Orchid Override:** Recording any species in the `orchid` group automatically elevates a verge below 60 points to at least **Promising verge** and attaches a mandatory Wildlife Trust referral flag.
* **Zero-Evidence Floor:** If the forb count is $0$ and no positive indicators are ticked, the tier is locked to **Ordinary verge** regardless of sward structure.
* **Management Flags:** Independently flags `CUTTINGS_LEFT` (mulching increases soil fertility), `MAY_JUNE_CUT` (early summer mowing prevents seed set), and `RANK_GROWTH` (uncollected tall swards forming thatch).

### 3. Cut-Regime Advisor (`verge-advice-v1`)
Matches segment attributes and triage tiers against four published management regimes:
* **`R1` — Single Late Cut:** One cut between August and end of September with cuttings removed (when budget allows only a single pass).
* **`RA` — Meadow Pattern A:** First cut mid-July to end of September; second cut before Christmas (mirrors traditional hay-meadow management).
* **`RB` — Meadow Pattern B:** Early cut in February or March before flowering, followed by a second cut in September or October.
* **`RU` — Urban Short Flowering Lawn:** Cut every 6 to 8 weeks to $3\text{–}6\text{ cm}$, supporting low-growing flora (clovers, bird's-foot trefoil, selfheal) in high-visibility urban settings.

**Non-Negotiable Overlays:** Every recommendation automatically embeds four mandatory operational rules: (1) maintain full visibility splays and sightlines at junctions and bends with a 1-working-width frequent cut, (2) leave a $10\text{–}20\%$ rotational uncut refuge strip at the back of the verge, (3) raise cutter bar height to protect amphibians and reptiles, and (4) apply multi-zone management on wide verges ($>3\text{ m}$).

### 4. "Which Cut Should We Drop?" Scenario Simulator
When a highway authority proposes removing $N$ annual cuts, the simulator evaluates every mathematical combination of candidate removals against a 12-month ecological alignment scale (where May carries an alignment value of $0$ due to peak flowering disruption, and August/September carry the maximum alignment value of $3$):
1. **Safety Lock (Rule 1):** Any cut marked `safetyCritical` cannot be dropped under any scenario.
2. **Late-Summer Preservation (Rule 2):** For `Promising` or `Refer for expert review` verges, at least one cut in August or September must remain to prevent scrub encroachment and allow seed shed.
3. **Combination Ranking:** Candidate removals are ranked ascending by total alignment lost, with optional user-supplied cost assumptions ($\text{Cuts Removed} \times \text{Cost per Cut per km} \times \text{km}$).

### 5. Council Registry, FOI/EIR Builder & Evidence Packs
* **Sourced Council Registry:** Browse verified highway authority policies (rural/urban cut frequencies, clippings handling, designated roadside nature reserves). Every fact requires a primary `sourceUrl` and ISO retrieval date. Users can queue new facts offline and export JSON proposals for review.
* **FOI & EIR Request Generator:** Produces a plain-English statutory request under the *Freedom of Information Act 2000* and *Environmental Information Regulations 2004*, requesting 3-year schedules, lengths by road class, designated verge lists, clippings policies, and ring-fenced budgets.
* **A4 Evidence Pack:** Compiles segment tables, score breakdowns, regime recommendations, simulator outputs, and council facts into a clean `@media print` A4 report, exportable as HTML and Markdown, or to PDF via the browser print dialog.

---

## 🏗️ Technical Architecture & Engineering Reference

Verge Ledger is engineered as a strict TypeScript monorepo using npm workspaces. Domain rules are completely decoupled from browser, storage, and network layers.

### System Architecture & Monorepo Layout

```
verge-ledger/
├── packages/
│   ├── core/         # Pure TypeScript domain logic, Zod schemas, scoring, advisor, simulator, exporters
│   └── data/         # Verified indicator dataset (indicators.json) + JSON Schemas; regimes live in core constants, council registry starts empty
├── apps/
│   ├── web/          # Offline-first Vite + React + Tailwind CSS PWA with Dexie (IndexedDB) & Leaflet
│   └── api/          # Optional Fastify service for workspace sync & public impact counters (in-memory store in this build; SQLite planned)
├── e2e/              # Playwright cross-browser, offline, and axe-core accessibility test suite
├── deploy/           # GitHub Pages and static-host deploy guides
└── docs/             # Specification pack, ADRs (DECISIONS.md),METHOD.md, DATA.md, PRIVACY.md
```

### Architectural Invariants

1. **Zero-Dependency Domain Core (`@verge-ledger/core`):** Contains zero DOM, Node, database, or network dependencies. All inputs and outputs are strictly validated via `zod` schemas. It executes identically inside a browser web worker, React component, Fastify route, or Vitest runner.
2. **Offline-First Storage & ULID Identity:** The primary system of record is client-side IndexedDB managed via `Dexie` (`VergeLedgerDB`). All entities (`workspaces`, `segments`, `observations`, `photos`) use client-generated 26-character Crockford base32 ULIDs, guaranteeing zero ID collisions during offline creation or multi-device sync.
3. **Cryptographic Workspace Sync (Optional API):** The web app functions $100\%$ standalone when `VITE_API_URL` is unset. When connected to `@verge-ledger/api` (Fastify; in-memory store in this build, SQLite planned — see docs/HANDOFF.md and OQ-8), workspaces authenticate using a 128-bit base32 edit key hashed server-side via `scrypt` with per-key salts and verified via constant-time comparison. Sync uses cursor-based push/pull (`lastSyncedAt`) with per-record last-write-wins (`updatedAt`) and tombstone propagation (`deletedAt`).
4. **Conservation & Privacy Guards in Export Pipeline:**
   * **EXIF Stripping:** Local photos never leave the device during sync and have all EXIF metadata stripped on capture/export.
   * **Sensitive Taxa Coarsening:** When exporting public `GeoJSON` (RFC 7946) or `CSV` (RFC 4180), any observation containing a species flagged `sensitive: true` (such as orchids) automatically has its coordinates coarsened to a $1\text{ km}$ grid resolution.
5. **Strict Demo Isolation:** Built-in onboarding workspaces carry `isDemo: true`, render a persistent `DEMO DATA` badge across the UI, apply a diagonal watermark on printed Evidence Packs, and are rejected by the sync API and public impact counters.

### Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Language & Validation** | TypeScript (`strict`), `zod` | End-to-end static and runtime schema validation across client and server |
| **Web Application** | React 18, Vite, React Router, Tailwind CSS | Fast code-split bundles (`<200 KB` initial gzip target) and high-contrast field UI |
| **Geospatial & Mapping** | Leaflet, Haversine geometry helpers | Lightweight map rendering with configurable tile providers and non-map form fallbacks |
| **Offline Persistence** | Dexie.js (IndexedDB), Service Worker PWA | Reliable offline field operation and precached application shell |
| **Optional Backend API** | Node LTS, Fastify (in-memory store in this build; SQLite planned) | RFC 9457 Problem Details error model, strict CSP/rate-limiting |
| **Verification Suite** | Vitest, Playwright, `@axe-core/playwright` | Unit, E2E offline journeys, and automated WCAG 2.2 AA audits (Playwright/axe browser run still pending — see docs/OPEN-QUESTIONS.md OQ-9) |

### Getting Started

#### Prerequisites
* **Node.js:** LTS version (see `.nvmrc`)
* **npm:** v9+ (supports npm workspaces)

#### Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/sgd-lab/Verge-Ledger.git
cd verge-ledger

# 2. Install dependencies across all workspaces
npm install

# 3. Start the web application (and optional local API) in development mode
npm run dev
```

To run the web application in **strictly local-only mode** (no API server required), leave `VITE_API_URL` empty in your `.env` file (see `.env.example`).

### Quality Gates & Verification Commands

Every commit is validated against strict quality and coverage gates ($\ge 90\%$ line coverage in `packages/core`, $\ge 70\%$ in `apps/web` and `apps/api`):

```bash
# Run ESLint across all packages
npm run lint

# Verify strict TypeScript project references
npm run typecheck

# Run unit, schema, property-based (fast-check), and golden fixture tests (A–E)
npm test

# Run Playwright E2E offline journeys and axe-core WCAG 2.2 AA accessibility checks
npm run test:e2e

# Production build across all workspaces
npm run build

# Verify runtime dependency licences (MIT, Apache-2.0, BSD, ISC only) and security audit
npm run licence-check
npm run audit
```

---

## 🛡️ Safety, Ethics & Data Integrity

Verge Ledger enforces strict operational and ethical guardrails both in documentation and directly within the application interface:

* **Roadside Personal Safety:** Always survey from a safe position (such as a pavement or quiet verge step-off). Avoid high-speed roads and never stand on the carriageway.
* **No Unauthorised Management:** Never cut, mow, pull up, sow, or alter a roadside verge without explicit written permission from the relevant highway authority or landowner. Do not trespass.
* **Highway Visibility Priority:** Road safety rules supersede all ecological guidance. Sightlines at junctions, bends, and visibility splays must never be obstructed.
* **Zero Invented Data:** Every indicator species weight, regime rule, and council registry entry in `packages/data` requires a verifiable `sourceUrl` and `sourceRetrievedAt` date validated by automated schema tests.
* **Privacy by Design:** No user accounts, email addresses, cookies, or third-party tracking scripts are used. Read the full details in [`docs/PRIVACY.md`](docs/PRIVACY.md).

---

## 🤝 Contributing

Contributions are welcome, particularly from ecologists, county flora recorders, parish clerks, and developers:

1. **Ecological Calibration & Species Review:** Help review the provisional weights in `packages/data/indicators.json` and threshold boundaries in [`docs/METHOD.md`](docs/METHOD.md).
2. **Council Registry Facts:** Submit verified highway authority cutting schedules or FOI responses with primary source links using our GitHub Issue templates.
3. **Code & Accessibility Improvements:** Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md) before opening a pull request. All commits follow the Conventional Commits specification.

---

## 📜 Licence & Attribution

* **Source Code:** Released under the [MIT License](LICENSE).
* **Documentation & Original Datasets:** Released under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Third-party citations retain their original licences as documented in [`docs/DATA.md`](docs/DATA.md).
* **Transparency Note:** Developed and maintained with AI coding assistance under strict human architectural specification, automated test verification, and source-citation enforcement. See [`docs/HANDOFF.md`](docs/HANDOFF.md) for verification status.
* **Acknowledgements:** Methodological rules and cut-timing regimes draw on published guidance from **Plantlife**, **The Wildlife Trusts**, **Lincolnshire Wildlife Trust**, and **Norfolk Wildlife Trust**. Verge Ledger is an independent open-source project and is not affiliated with or endorsed by these organisations.