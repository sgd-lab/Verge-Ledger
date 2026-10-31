# 06 - Repo Launch Files

The agent commits these into the repo and adapts them to what is actually built. Replace bracketed items with real values. Do not leave brackets in committed files. Do not add badges, screenshots or claims for things that do not exist.

## 1\. LICENSE (MIT)

```
MIT License

Copyright (c) 2026 [Owner full name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 2\. README.md (template)

```
# Verge Ledger

Evidence and cut-timing tools for road verges. Built for parish councils and volunteers in England.

[Live demo](URL) | [Documentation](docs/) | [Report an issue](ISSUES URL)

Status: v0.1.0. Works offline. The scoring rules are a volunteer triage and have not yet been reviewed by an ecologist.

## Why this exists

Road verges can hold hundreds of wildflower species, yet many are cut in spring and have cuttings left on site. Published guidance says later cuts and removal of cuttings help wildflowers. Councils rarely publish what they cut, when, and where, and volunteers have no simple shared way to record what verges hold.

Verge Ledger helps a parish go from "we think this verge is special" to a short, sourced evidence pack in under an hour.

## What it does

- Survey: record a verge segment in about five minutes, offline, on a phone.
- Score: get a transparent triage score with a plain-language explanation.
- Advise: get a cut-timing recommendation based on published guidance, with a safety overlay.
- Which cut to drop: when a council proposes fewer cuts, rank the options against wildflower guidance.
- Registry: see how councils manage verges, every fact with a source.
- Request builder: generate an information request under FOI and EIR.
- Evidence pack: print or export a one-page-to-few-pages report.

## What it does not do

- It does not identify species or use machine learning.
- It does not designate Local Wildlife Sites or replace an ecological survey.
- It does not assess road safety. Highway safety rules take priority.
- It does not calculate Biodiversity Net Gain.

## Safety and ethics

- Survey from a safe position and avoid fast roads. Never stand on the carriageway.
- Never cut, pull up or sow a verge without written permission from the highway authority or landowner.
- Do not trespass.
- Rare plant locations are coarsened in public exports.

## Quick start

Requirements: Node LTS (see .nvmrc).

    npm install
    npm run dev

Open the web app at the URL printed in the terminal. The API is optional.

## Run the tests

    npm run lint
    npm run typecheck
    npm test
    npm run test:e2e

## Project layout

See docs/02-architecture.md.

## Data and sources

Every indicator species, guidance statement and council fact has a source URL and retrieval date. See docs/DATA.md. Demo data is synthetic and labelled.

## Privacy

No accounts, no tracking scripts. Photos stay on your device. See docs/PRIVACY.md.

## Contributing

See CONTRIBUTING.md. We especially welcome corrections to the species list, council facts with sources, and field feedback.

## Licence

Code: MIT. Documentation and original data: CC BY 4.0. Third-party data keeps its own licence, listed in docs/DATA.md. Map tiles: see attribution in the app.

## Transparency

This project is developed by [owner name] with AI coding assistance. All code is reviewed and tested. See docs/HANDOFF.md for what is verified.

## Acknowledgements

Guidance from Plantlife, The Wildlife Trusts and Lincolnshire Wildlife Trust informed the method. This project is not affiliated with or endorsed by them.
```

Agent notes: remove the live demo line until the URL exists. Do not state any partner, user count, or endorsement. If an ecologist has reviewed the rules, say so with their consent and name only after they agree.

## 3\. CONTRIBUTING.md (template)

```
# Contributing

Thanks for helping. This project values accuracy over volume.

## Ways to help
- Fix or source the indicator species list (docs/DATA.md explains how).
- Add or correct council facts with a primary source and date.
- Report bugs and accessibility problems.
- Share field feedback after using the survey.

## Ground rules
- No invented data. Every fact needs a source URL and retrieval date.
- Safety first: do not add features that encourage unsafe or unauthorised actions.
- Keep core logic pure and tested.

## Development
1. Fork and clone.
2. npm install
3. npm run dev
4. Run npm run lint, npm run typecheck and npm test before opening a pull request.

## Commit messages
Conventional Commits, for example: feat(core): add refuge overlay to advisor.

## Pull requests
- Keep them focused.
- Include tests.
- Reference requirement IDs from docs/01-prd.md where relevant.
- Update docs if behaviour changes.

## Reporting a council fact
Open an issue using the Council fact template with the council, the fact, the source URL, and the date you read it.
```

## 4\. SECURITY.md (template)

```
# Security Policy

## Supported versions
Latest release only.

## Reporting a vulnerability
Email [security contact] with details. Please do not open a public issue for vulnerabilities. You will get an acknowledgement within 7 days.

## Scope
The web app, the optional API and the deployment guides in this repo.

## Data handled
Workspace data a user chooses to sync, hashed edit keys, aggregate counters. No accounts, no emails.
```

## 5\. CODE_OF_CONDUCT.md

Use the Contributor Covenant version 2.1 text, fetched from the official source at contributor-covenant.org. Keep the attribution that the licence requires. Set the enforcement contact to \[security or contact email\]. Do not paraphrase the text.

## 6\. docs/PRIVACY.md (outline for the agent to complete accurately)

* What is stored locally (workspaces, segments, observations, photos) and that it never leaves the device unless the user enables sync.
* What the optional server stores and for how long.
* That no cookies, analytics or third-party scripts are used.
* That map tiles are fetched from the configured tile provider, which will see the user's IP address and the tiles requested. Name the provider.
* How to delete data: local delete, and workspace deletion request by edit key.
* Contact.
* Mark as "not legal advice" and have the owner review before launch.

## 7\. docs/DATA.md (outline)

* Indicator species: source for each entry, how weights were assigned (provisional), review status, how to propose changes.
* Guidance statements: sources and retrieval dates.
* Council facts: how verified, how to propose, status meanings.
* Licences table: code MIT, documentation and original data CC BY 4.0, third-party sources with their licences and attribution wording, map tiles attribution.
* Demo data statement.

## 8\. .github/ISSUE_TEMPLATE files

Create three YAML forms.

Bug report fields: what happened, what you expected, steps, device and browser, screenshots (optional).

Council fact fields: council name, fact type, value, source URL, date you read it, notes.

Species or guidance correction fields: item, what is wrong, proposed fix, source URL.

Pull request template: summary, requirement IDs, tests added, docs updated, checklist (lint, typecheck, tests, no invented data).

## 9\. CHANGELOG.md (start)

```
# Changelog

All notable changes are listed here. Format follows Keep a Changelog. Versions follow Semantic Versioning.

## [Unreleased]

## [0.1.0] - [release date]
### Added
- Offline-first survey, triage score, advisor, scenario simulator, registry, request builder, evidence pack, import and export, optional sync API.
```

## 10\. GitHub repository settings (human steps)

* Public repository named verge-ledger (or final name).
* Description: "Evidence and cut-timing tools for road verges. Offline-first. For parish councils and volunteers."
* Topics: biodiversity, road-verges, citizen-science, pollinators, wildflowers, parish-councils, open-source, offline-first, pwa, uk.
* Enable Issues and Discussions. Enable GitHub Pages from the deploy workflow.
* Add a social preview image only if you made it yourself.
* Pin the live demo link in the About box.