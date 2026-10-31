# Architecture Decision Records (ADRs)

This document records the architectural and design decisions made for Verge Ledger.

---

## ADR-001: Monorepo Architecture with npm Workspaces

- **Status**: Accepted
- **Context**: Verge Ledger requires modular code sharing between core domain logic, data models, web UI, optional API server, and end-to-end test suites.
- **Decision**: Adopt standard `npm workspaces` in a monorepo (`packages/core`, `packages/data`, `apps/web`, `apps/api`, `e2e`).
- **Consequences**: Avoids complex external package registry publishing; enables atomic refactoring and cross-workspace TypeScript project references.

---

## ADR-002: Zero-Dependency Pure Core (`packages/core`)

- **Status**: Accepted
- **Context**: The domain scoring engine, cut-timing advisor, and geometry calculations must execute consistently across browser web workers, Node.js API servers, and CLI testing environments.
- **Decision**: Enforce that `packages/core` has absolutely zero DOM, Node, or network dependencies.
- **Consequences**: Simplifies automated testing, achieves >= 90% test coverage with Vitest, and prevents vendor or platform lock-in.

---

## ADR-003: Offline-First Client Storage with Dexie (IndexedDB)

- **Status**: Accepted
- **Context**: Road verges frequently sit in rural areas with poor or absent mobile cellular coverage.
- **Decision**: Use IndexedDB via Dexie.js as the primary client database. Client-generated ULIDs ensure collision-free record creation while offline.
- **Consequences**: All survey, scoring, and advisor workflows function completely offline. Syncing with remote APIs is treated as an optional secondary operation.

---

## ADR-004: Local-Only Photo Storage with Automatic EXIF Stripping

- **Status**: Accepted
- **Context**: Volunteer surveyors capture roadside photos. Photographs contain precise embedded EXIF GPS coordinates, creating privacy risks and potential revealing of sensitive plant taxa.
- **Decision**: Store photos locally as Blobs in IndexedDB (maximum 3 per observation). Automatically strip EXIF metadata prior to export or pack generation. Never sync photos to the API server in v0.1.0.
- **Consequences**: Safeguards user privacy and sensitive ecological habitats without requiring expensive cloud media storage.

---

## ADR-005: Map Rendering with Leaflet and Configurable Tile Attribution

- **Status**: Accepted
- **Context**: Surveyors need visual confirmation of verge geometry and road class.
- **Decision**: Use Leaflet with standard OpenStreetMap/CartoDB tiles in development, configured via `VITE_TILE_URL`. Ensure attribution is permanently visible. Provide an accessible non-map form alternative (`ACC-1`).
- **Consequences**: Lightweight client bundle; respects open tile usage policies; fully accessible for users unable to use interactive maps.

---

## ADR-006: Dual Licensing Structure

- **Status**: Accepted
- **Context**: Code and datasets require clear open-source licensing to encourage council and community adoption.
- **Decision**: Release software code under the MIT License and documentation/original data under Creative Commons Attribution 4.0 International (CC BY 4.0).
- **Consequences**: Maximum compatibility with local government IT policies and open citizen-science datasets.

---

## ADR-007: Scrypt-Hashed Edit Keys for Workspace Sync

- **Status**: Accepted
- **Context**: Users collaborating on a workspace need write authorization without requiring user accounts or passwords.
- **Decision**: Generate a random 128-bit secret edit key on the client. The server stores only an irreversible `scrypt` hash with a per-workspace salt and compares tokens in constant time.
- **Consequences**: Eliminates account databases, email verification flows, and credential exposure risks.

---

## ADR-008: Commit Sequence Alignment — Commit 18 Split and Commit 14/15 Consolidation

- **Status**: Accepted
- **Context**: In `05 - Commit Plan_ 50 Commits to v0_1_0.md`, Commit 14 was planned for the cut-regime advisor (`verge-advice-v1`) and Commit 15 for safety & refuge overlays. During implementation, safety framing (1.2m swathe), refuge margins (10%–20%), and cutter bar elevation (>= 8cm) were identified as inseparable domain constraints of the advisor, naturally integrating into a single cohesive commit (`6f1f6b0`). Simultaneously, Commit 18 was scoped to contain both geodetic geometry calculations (Haversine distance, segment validation, OSGB36 Helmert transformation) and data export helpers (GeoJSON FeatureCollection, RFC 4180 CSV). Combining these two distinct concerns would violate the atomic commit principle.
- **Decision**: Merge the safety overlays into Commit 14 (`feat(core): implement cut-regime advisor with safety and refuge overlays`), and split Commit 18 into two discrete atomic commits: Commit 17 (`feat(core): implement geodetic geometry, haversine, and OSGB36 1km grid coarsening`) and Commit 18 (`feat(core): implement GeoJSON and CSV export helpers with photo EXIF stripping`).
- **Consequences**: Conforms to the governance clause in `05 - Commit Plan` ("If two steps naturally merge or one needs splitting, do it and record why in docs/DECISIONS.md. Total must stay between 40 and 50 and must reflect real work"). Total commit count for Phase 1 remains exactly 9 commits (Commits 10 through 18).
