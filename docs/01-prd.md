# 01 - PRD: Verge Ledger v0.1

Status: Draft for build. Owner: \[Your name\]. Repo: verge-ledger. Licence: MIT (code), CC BY 4.0 (documentation and original data). Read first: 00-research-brief. Rules for scoring and advice are in 03-method-and-rules. Architecture is in 02-architecture.

## 1\. Summary

Verge Ledger helps parish councils, volunteer groups and residents in England gather defensible evidence about road verges and make better cut-timing decisions. It combines a five-minute mobile survey, a transparent triage score, a cut-timing advisor, a "which cut should we drop?" scenario tool, a ready-to-send information request generator, a printable evidence pack and an open registry of how councils manage verges.

## 2\. Problem

Road verges are a large, low-cost habitat that is mostly managed for safety and appearance. Published guidance says cut timing and removal of cuttings decide whether verges hold wildflowers. FOI work shows many councils still cut in spring and few follow late-cut guidance. The people who could change that, parish councils and local volunteers, lack three things:

1. A quick, consistent way to record what a verge holds.
2. Plain-language, source-cited advice on when to cut.
3. A public, comparable view of what their highways authority does.

Volunteer verge surveys have worked (Lincolnshire: 250+ volunteers, 3,900 km, 159 new Local Wildlife Sites) but took years and bespoke GIS. When budgets force cuts (Norfolk is consulting on removing one rural cut), nobody has a tool to ask which cut can go with least harm.

## 3\. Users

Primary

* Parish clerk or councillor: wants a short, credible document to take to the county council or to brief a contractor. Not an ecologist. Uses a laptop and a phone.
* Volunteer surveyor (wildlife group member, resident): wants to log verges quickly, offline, with minimal training.

Secondary

* Wildlife Trust or record-centre staff: want clean exports (GeoJSON, CSV) and a flag for sites that deserve an expert visit.
* Council officer or ecologist: may use the registry and advisor. Not a target for v0.1 workflows.

Out of scope users: schools (later), developers, researchers needing bulk data.

## 4\. Goals and non-goals

Goals

1. A parish can go from zero to a one-page evidence pack for one road in under 60 minutes, including a field survey of at least five segments.
2. Every score, recommendation and registry fact is traceable to a rule or a source.
3. Works offline in the field and on poor mobile signal.
4. Accessible (WCAG 2.2 AA target) and privacy-light.

Non-goals for v0.1

* Species identification from photos or any machine learning.
* Official habitat classification, Local Wildlife Site designation, or Biodiversity Net Gain calculation.
* User accounts, social features, payments.
* Server-side photo storage.
* Coverage of Scotland, Wales and Northern Ireland rules (configurable later).

## 5\. Success metrics

These are the public impact counters. Targets are proposals to be confirmed by the owner. They are not claims.

| Metric | Definition | Proposed 6-month target |
| --- | --- | --- |
| Verge length surveyed | Sum of surveyed segment length, km, real (non-demo) data only | 25 km |
| Segments scored | Count of real segments with a saved score | 400 |
| Segments flagged for expert review | Tier "Refer for expert review" | tracked, no target |
| Evidence packs generated | Count of exported packs | 10 |
| Active workspaces | Workspaces with at least 5 real segments | 5 |
| Councils in registry with a cited source | Count | 30 |
| Information requests generated | Count (counter only, content never stored) | 15 |
| Time to first pack | Median minutes from workspace creation to first pack, self-reported by timestamp | under 60 |

Rules: demo data never counts. Counters are aggregates only. No individual tracking.

## 6\. Scope for v0.1

In scope: survey, score, advisor, scenario simulator, registry (browse and contribute), request generator, evidence pack, import and export, PWA offline, optional sync API, safety and ethics copy, demo workspace, accessibility, docs, CI and deployment guides.

Later: council-level aggregation dashboards, Wales and Scotland rule sets, school mode, biological record centre submission format, optional photo upload with moderation, translation.

## 7\. Functional requirements

Each requirement has an ID. The agent must write at least one automated test per requirement with the same ID in the test name where practical.

### 7.1 Survey

* SUR-1: A user can create a verge segment by placing 2 or more points on a map or by using device location as the start point and adding an end point. Segment length is computed in metres.
  * Acceptance: a segment shorter than 5 m or longer than 500 m is rejected with a clear message. Length error under 1 percent versus a reference haversine calculation in unit tests.
* SUR-2: A user records segment attributes: road class (A, B, C, Unclassified, Unknown), setting (rural, urban), verge width band (under 1.5 m, 1.5 to 3 m, over 3 m), side of road (left, right, both, unknown), road name (free text, optional).
* SUR-3: A user records an observation: date and time (default now), flowering wildflower species count in the surveyed 10 m sample (0, 1-2, 3-5, 6-9, 10-14, 15+), ticked indicator species from the curated list, nutrient-enrichment species dominant (multi-select), sward structure (short uniform, medium mixed, tall rank or thatch), cut state (uncut this year, cut recently, unknown), cuttings state (removed, left on verge, not applicable), last known cut month if known, free-text notes.
* SUR-4: A user can attach up to 3 photos per observation. Photos are stored locally only. EXIF location data is stripped on any export.
* SUR-5: Surveys work fully offline. Saving never requires a network call.
* SUR-6: A first-run and per-survey safety panel states: survey from a safe position, avoid fast roads, never cut or damage a verge without written permission, do not trespass. User must acknowledge once per device.
* SUR-7: Sensitive taxa selected (flag in data) trigger a notice and set the observation's location precision for public export to 1 km.

### 7.2 Score

* SCO-1: The score is computed exactly per 03-method-and-rules, with the version string stored on every result.
* SCO-2: A score view shows the tier, the numeric score, a points breakdown, management flags, and a plain-language explanation of what would change the result.
* SCO-3: Tier names are "Ordinary verge", "Promising verge", "Refer for expert review". No tier uses the words "designated", "protected" or "Local Wildlife Site" as a claim.
* SCO-4: Every score view and export carries the disclaimer text defined in 03-method-and-rules.

### 7.3 Advisor

* ADV-1: A user selects a segment or enters attributes manually and receives one primary recommendation and one fallback recommendation from the regime set in 03-method-and-rules.
* ADV-2: Each recommendation lists months, cuttings handling, safety overlay, refuge rule, rationale, and source citations.
* ADV-3: If cuttings cannot be removed, the output includes a clear flag that fertility will build up and cut-and-collect is preferable.
* ADV-4: The advisor never recommends removing safety-critical cuts (visibility splays, junctions, bends). It states this.

### 7.4 Scenario simulator: which cut to drop?

* SIM-1: A user enters a council or road's current annual cuts as months, marks any cut as safety-critical, selects verge tier (or "unknown"), and chooses a proposal: remove one cut, or remove N cuts.
* SIM-2: The tool ranks candidate removals by ecological alignment per 03-method-and-rules and explains the rank.
* SIM-3: Optional cost inputs (cost per cut per km, km of road) produce an indicative saving for each option, labelled as the user's own assumption.
* SIM-4: Presets exist for illustrative scenarios (for example, "rural road with three cuts") and are clearly labelled as illustrations, not council data.
* SIM-5: Output can be added to the evidence pack.

### 7.5 Council registry

* REG-1: Browse and search councils (county, unitary, parish note) with fields: rural cuts per year, urban cuts per year, typical first-cut month, cuttings policy (collected, left, mixed, unknown), designated verge scheme (name, count, length if stated), source URL, source retrieval date, status (unverified, verified).
* REG-2: Every non-empty fact must have a source URL. The UI shows the source next to the fact.
* REG-3: A user can propose an edit or addition. Proposals enter "unverified" status and require maintainer approval via the API admin key. In offline-only mode proposals are stored locally and exported as a JSON file for a GitHub issue.
* REG-4: Seed data contains only facts the agent has verified from primary council pages at build time. Anything else is blank.

### 7.6 Information request builder

* REQ-1: A user selects a council and builds a request text asking for: verge cutting schedule by road class (dates and number of cuts), verge area or length by class, list of designated or protected verges, cuttings removal policy, and verge maintenance budget, for the last 3 years.
* REQ-2: The text cites the Freedom of Information Act 2000 and the Environmental Information Regulations 2004, asks for a response in a reusable format (CSV or spreadsheet), and notes the 20 working day limit. It carries a "not legal advice" notice.
* REQ-3: The tool does not send anything. It offers copy, download and a link to publish via WhatDoTheyKnow.
* REQ-4: A counter increments on generation. The text is never stored on a server.

### 7.7 Evidence pack

* PCK-1: A user selects a workspace and a road or area and generates a printable report: summary, map snapshot or coordinates table, segment table with tiers, key findings, advisor output, optional simulator output, council registry facts with sources, method and disclaimer, and contact line.
* PCK-2: The pack prints cleanly to A4 and exports as HTML and Markdown. PDF is produced via the browser print dialog. No server rendering.
* PCK-3: The pack states clearly which data is real and which is demo, and refuses to include demo data in a pack labelled "real" (demo packs carry a watermark).

### 7.8 Import and export

* EXP-1: Export workspace data as GeoJSON and CSV with a documented schema. Export is local, no network.
* EXP-2: Import validates against the schema and rejects bad rows with row-level errors.
* EXP-3: Public-facing exports coarsen sensitive taxa locations to 1 km.

### 7.9 Sync (optional)

* SYN-1: A workspace can be created on the API with a name and a generated edit key shown once. Only a hash is stored.
* SYN-2: Clients push and pull changes by record with updated-at timestamps and tombstones. Last write wins per record.
* SYN-3: The app works fully without the API (local-only mode).
* SYN-4: API rate limits and validates all input.

### 7.10 Impact page

* IMP-1: A public page shows the counters defined in section 5, with definitions, from the API when available, or an honest "no server connected" message in local-only mode.
* IMP-2: Counters exclude demo data.

### 7.11 Demo workspace

* DEM-1: A demo workspace of synthetic segments can be loaded for onboarding. Every screen shows a "DEMO DATA" badge while it is active. Demo data never syncs and never counts.

## 8\. UX principles

* Plain English. Reading age about 12. No ecological jargon without a one-line explanation.
* Mobile first, one-handed field flow, large targets, high contrast, usable in sunlight.
* Every result answers: what did you find, what does it mean, what should we do next, what is the source.
* Honest uncertainty: a visible "how sure are we" line on every score and recommendation.
* No dark patterns, no popups, no analytics scripts.

Screens: Home and safety, Workspace list, Map and segments, New survey (4 steps), Segment detail and score, Advisor, Which cut to drop, Council registry, Request builder, Evidence pack, Export and import, Impact, About and method.

## 9\. Non-functional requirements

* Performance: first load under 200 KB gzipped JavaScript for the initial route (code-split map and report). Largest Contentful Paint under 2.5 s on a mid-range phone on 4G.
* Offline: after first load the app shell and all survey flows work with no connection.
* Accessibility: WCAG 2.2 AA target. Automated axe checks in CI. Manual keyboard pass documented.
* Privacy: no personal data required. No third-party scripts. A privacy notice in docs and in-app.
* Security: input validation with zod on both client and server, rate limiting, strict Content Security Policy, hashed edit keys using scrypt, dependency audit in CI, no secrets in the repo.
* Quality: core package at or above 90 percent line coverage, web and API at or above 70 percent, end-to-end tests for the main flows.
* Licensing hygiene: only MIT, Apache-2.0, BSD or ISC runtime dependencies. A licence check runs in CI. Map tiles and data sources carry attribution.

## 10\. Risks and mitigations

See 00-research-brief section 7. Additional product risks:

* Low volunteer data quality: mitigate with simple fields, examples, and the "refer for expert review" tier rather than any claim of certainty.
* Adoption: mitigate with a printable pack aimed at parish clerks and a registry that is useful even with zero surveys.
* Maintainer load: mitigate with schema validation, a CONTRIBUTING guide and moderation status on registry edits.

## 11\. Dependencies and external facts

* Guidance sources: Plantlife Good Verge Guide, Plantlife Managing Grassland Road Verges, Wildlife Trust guidance. Linked in 03-method-and-rules.
* Map tiles: OpenStreetMap standard tiles are acceptable for development and light demo use only. The base URL is configurable. Before wider launch choose a tile provider whose terms permit the expected traffic.
* No paid API keys needed for v0.1.

## 12\. Roadmap and milestones (6 to 12 months, for the application)

| When | Milestone | Evidence |
| --- | --- | --- |
| Month 0 | Public repo, v0.1.0 tag, live demo | GitHub release |
| Month 1 | Pilot survey of at least one real stretch with named local contact | Real data in a pilot workspace |
| Month 2 | Ecologist or Wildlife Trust review of indicator list and thresholds | Review notes in docs |
| Month 3 | First parish evidence pack delivered | Pack PDF |
| Month 4 | Registry covers at least 15 councils with cited sources | Registry export |
| Month 6 | Impact page shows real counters; v0.2 with feedback fixes | Release notes |
| Month 9 | Wales and Scotland rule-set research; record-centre export format | Design note |
| Month 12 | Year-one impact report published | Public report |

## 13\. Release criteria for v0.1.0

* All requirements in section 7 implemented or explicitly deferred in docs/OPEN-QUESTIONS.md.
* CI green on main. Core coverage at or above 90 percent. E2E flows pass.
* axe reports no serious or critical issues on main screens.
* README, LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, PRIVACY, METHOD, DATA, ACCESSIBILITY present.
* Every registry seed fact and every indicator species has a source and retrieval date.
* A static demo is deployed and linked from the README.

## 14\. Open questions

1. Final product name and domain.
2. Which ecologist or Wildlife Trust contact will review the indicator list and thresholds.
3. Whether Hostinger Restore Unlimited supports a custom Node API. Local-only mode is the fallback.
4. Tile provider choice for production.
5. Which county or parish hosts the first real pilot.