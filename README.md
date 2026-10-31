# Verge Ledger

Evidence and cut-timing tools for road verges. Built for parish councils and volunteers in England.

[Documentation](docs/) | [Report an issue](https://github.com/verge-ledger/verge-ledger/issues)

**Status**: v0.1.0 in development. Works offline. The scoring rules are a volunteer triage and have not yet been reviewed by an ecologist.

## Why this exists

Road verges can hold hundreds of wildflower species, yet many are cut in spring and have cuttings left on site. Published guidance says later cuts and removal of cuttings help wildflowers. Councils rarely publish what they cut, when, and where, and volunteers have no simple shared way to record what verges hold.

Verge Ledger helps a parish go from "we think this verge is special" to a short, sourced evidence pack in under an hour.

## What it does

- **Survey**: record a verge segment in about five minutes, offline, on a phone.
- **Score**: get a transparent triage score with a plain-language explanation.
- **Advise**: get a cut-timing recommendation based on published guidance, with a safety overlay.
- **Which cut to drop**: when a council proposes fewer cuts, rank the options against wildflower guidance.
- **Registry**: see how councils manage verges, every fact with a source.
- **Request builder**: generate an information request under FOI and EIR.
- **Evidence pack**: print or export a one-page-to-few-pages report.

## What it does not do

- It does not identify species or use machine learning.
- It does not designate Local Wildlife Sites or replace an ecological survey.
- It does not assess road safety. Highway safety rules take priority.
- It does not calculate Biodiversity Net Gain (BNG).

## Safety and ethics

- Survey from a safe position and avoid fast roads. Never stand on the carriageway.
- Never cut, pull up or sow a verge without written permission from the highway authority or landowner.
- Do not trespass.
- Rare and sensitive plant locations are coarsened to 1 km in public exports.

## Quick start

Requirements: Node LTS (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open the web app at the URL printed in the terminal. The API is optional.

## Run the tests

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Project layout

```
verge-ledger/
├── packages/
│   ├── core/         # Pure domain logic, Zod schemas, scoring, advisor, simulator (zero DOM/network)
│   └── data/         # Verified indicators, cut regimes, council facts with JSON schemas
├── apps/
│   ├── web/          # Offline-first Vite + React + Tailwind PWA with Dexie & Leaflet
│   └── api/          # Lightweight Fastify API for optional sync and council registry
├── e2e/              # Playwright test suite for offline and browser verification
├── docs/             # Technical and operational documentation suite
└── .github/          # CI workflows, issue templates, and pull request template
```

## Data and sources

Every indicator species, guidance statement, and council fact has a source URL and retrieval date. See [`docs/DATA.md`](docs/DATA.md). Demonstration data is synthetic and clearly labelled `DEMO`.

## Privacy

No accounts, no tracking scripts. Photos stay on your device. See [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). We especially welcome corrections to the species list, council facts with sources, and field feedback.

## Licence

- Code: MIT (see [`LICENSE`](LICENSE)).
- Documentation and original data: CC BY 4.0.
- Third-party data keeps its own licence, listed in [`docs/DATA.md`](docs/DATA.md).
- Map tiles: OpenStreetMap / CartoDB (see attribution in the app).

## Transparency

This project is developed with AI coding assistance. All code is reviewed and tested. See [`docs/HANDOFF.md`](docs/HANDOFF.md) for what is verified.

## Acknowledgements

Guidance from Plantlife, The Wildlife Trusts, and Lincolnshire Wildlife Trust informed the method. This project is not affiliated with or endorsed by them.
