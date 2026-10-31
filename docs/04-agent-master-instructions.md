# 04 - Agent Master Instructions

This document has two parts.

- Part A: the short prompt to paste into Antigravity (or any coding agent) together with the attached docs.
- Part B: the full AGENTS.md. The agent must commit this file to the repo root in commit 2.

Attach these docs: 00-research-brief, 01-prd, 02-architecture, 03-method-and-rules, 04 (this file), 05-commit-plan, 06-repo-launch-files, 07-hostinger-application-kit.

---

## Part A: Paste-in prompt

You are the lead engineer on an open-source project called Verge Ledger. I have attached eight documents that define it. Read all of them completely before writing any code. They are the specification. If documents conflict, 03-method-and-rules wins on logic, 01-prd wins on scope, 02-architecture wins on technical choices, and this file wins on process.

Your job: create a new public Git repository named verge-ledger and build version 0.1.0 exactly as specified, in the order given in 05-commit-plan, as 40 to 50 real, atomic commits.

Non-negotiable rules:

1. Honest history. Every commit must contain real work, pass lint, typecheck and tests locally before you commit, and use Conventional Commits. Do not backdate commits. Do not fabricate authors. Do not split work into artificial tiny commits just to hit a number. If the plan's natural count lands between 40 and 50, that is correct. Never exceed 50 or go below 40 by padding or squashing dishonestly. If a step needs to be merged or split, record why in docs/DECISIONS.md.
2. No invented facts. Every species entry, guidance statement, council fact and statistic needs a source URL and a retrieval date. Fetch the source yourself. If you cannot verify something, leave it out, add TODO(verify) in the data, and list it in docs/OPEN-QUESTIONS.md. Numbers in my docs are leads, not facts.
3. Demo data is synthetic, labelled DEMO everywhere, and never counted in impact metrics.
4. Licences: repository is MIT. Runtime dependencies must be MIT, Apache-2.0, BSD or ISC. Check licences. Do not copy code from sources with incompatible licences.
5. No secrets, keys or personal data in the repo. Use .env.example.
6. Ask me before: choosing a different stack than 02-architecture, adding any paid service or API key, adding any analytics or third-party script, or making any claim in README about endorsements, partners, users or results.
7. Work loop for each commit: read the plan step, implement, add or update tests, run npm run lint, npm run typecheck, npm test, update docs if behaviour changed, commit with the message from the plan (improve the wording if needed), and after every 3 to 5 commits push to origin.
8. At the end, write docs/HANDOFF.md listing what is done, what is verified, what is unverified, what I must do by hand (real-world pilot survey, ecologist review, domain, Hostinger steps), and how to run everything.

Start by asking me for: my full name for the LICENSE, my GitHub username or remote URL, and my preferred git author name and email. Then begin with commit 1.

---

## Part B: AGENTS.md (commit to the repo root)

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
