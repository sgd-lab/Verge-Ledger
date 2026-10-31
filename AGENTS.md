# AGENTS.md

Guidance for AI coding agents and human contributors working on Verge Ledger.

## Mission

Build and maintain an open-source, offline-first toolkit that helps parish councils and volunteers in England gather evidence about road verges and make better cut-timing decisions. Read docs/01-prd.md, docs/02-architecture.md and docs/03-method-and-rules.md before changing code.

## Source of truth order

1. docs/03-method-and-rules.md for scoring, advice, simulator and request text
2. docs/01-prd.md for scope and acceptance criteria
3. docs/02-architecture.md for technical decisions
4. This file for process

## Repository rules

- Monorepo with npm workspaces: packages/core, packages/data, apps/web, apps/api, e2e.
- TypeScript strict everywhere. No any without a comment explaining why.
- packages/core has no DOM, Node or network dependencies.
- All external data lives in packages/data with a JSON schema and a test that validates it.
- Each requirement ID in docs/01-prd.md has at least one test whose name contains the ID.

## Commit discipline

- Conventional Commits: type(scope): summary in imperative mood, 72 characters or fewer. Types: feat, fix, docs, test, refactor, chore, ci, perf, build.
- One logical change per commit. Each commit must leave main green: lint, typecheck, tests pass.
- Body explains why, references requirement IDs (for example SUR-1) and links sources for any data or guidance.
- Never rewrite published history. Never force-push to main.
- Do not backdate commits. Do not add co-authors who did not contribute.
- Push after every 3 to 5 commits.

## Quality gates (must pass before every commit)

- npm run lint
- npm run typecheck
- npm test (unit and integration)
- For UI changes, also run the relevant Playwright test locally and the axe check on the changed route.
- Coverage thresholds: core at or above 90 percent lines, web and API at or above 70 percent. Do not lower thresholds to pass.

## Data integrity rules

- Species, guidance and council facts need sourceUrl and sourceRetrievedAt (ISO date).
- Never invent a number. Unknown stays unknown.
- Scoring thresholds and weights are configuration, versioned (verge-triage-v1), and marked as needing ecologist review until a named reviewer is recorded in docs/DECISIONS.md.
- Sensitive taxa never appear at precise location in any public export.
- Demo data is flagged isDemo, labelled DEMO in the UI, excluded from sync, impact counters and real packs.

## Safety and ethics rules (copy must appear in the product)

- Survey from a safe position. Avoid fast roads. Never stand on the carriageway.
- Never cut, pull up, sow or damage a verge without written permission from the highway authority or landowner.
- Do not trespass.
- The score is a volunteer triage. It is not a Local Wildlife Site assessment or legal advice.
- Highway safety rules take priority over any recommendation.

## Privacy rules

- No accounts, no emails, no third-party scripts in v0.1.
- Photos are stored locally only. Strip EXIF location data on export.
- Server stores only workspace data the user chose to sync, hashed edit keys, aggregate counters, and registry facts.
- No personal data in logs.

## Security rules

- Validate all input with zod on client and server. Reject unknown fields.
- Hash edit keys with scrypt and per-key salt. Constant-time compare.
- Rate limit all write endpoints.
- Strict CSP with no inline scripts. Add security headers.
- Run dependency audit and licence check in CI.

## Accessibility rules

- WCAG 2.2 AA target. Semantic HTML. Labelled controls. Visible focus. Keyboard operable.
- Never rely on colour alone. Never make the map the only way to do something.
- axe checks run on main routes in CI.

## UX writing rules

- Plain English, reading age about 12. Explain any ecological term in one line.
- Every result answers: what we found, what it means, what to do next, source.
- Show uncertainty honestly. Never claim certainty the rules do not support.

## What not to build in v0.1

- Image recognition or any machine learning
- User accounts, social features, payments
- Server-side photo storage
- BNG calculations or habitat classification
- Analytics or tracking scripts

## When to stop and ask the owner

- Any conflict between documents that you cannot resolve by the source-of-truth order
- Needing a paid service or credential
- Any claim about partners, users, endorsements or results
- Uncertainty about a legal statement in the information request template
- Licence uncertainty about a dependency or data source

## Definition of done for the project (v0.1.0)

See section 13 of docs/01-prd.md. In addition:

- docs/HANDOFF.md exists and is accurate.
- docs/OPEN-QUESTIONS.md lists every unverified item.
- README accurately states what is built, what is demo, and what is not yet reviewed by an ecologist.
- Git tag v0.1.0 and CHANGELOG entry exist.

## Transparency

This project is developed by a human maintainer using AI coding assistance. The README states this plainly.

## Commands (create these npm scripts)

- npm run dev (web and api together)
- npm run build
- npm run lint
- npm run typecheck
- npm test
- npm run test:e2e
- npm run licence-check
- npm run audit
