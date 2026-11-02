## Summary of Changes

Describe the goal and technical changes introduced in this pull request.

## Requirement IDs Addressed

List the feature areas implemented or tested (e.g., survey, scoring, advisor, simulator, export, registry):
-

## Verification & Tests Added

Describe the automated tests added or updated:

- [ ] Unit / property tests in `packages/core`
- [ ] Schema validation in `packages/data`
- [ ] Component / UI tests in `apps/web`
- [ ] Playwright E2E / axe accessibility tests in `e2e`

## Documentation

- [ ] Updated relevant documentation in `docs/` (`DATA.md`, `03-method-and-rules.md`, `PRIVACY.md`, etc.)
- [ ] Documented any architectural decisions in `docs/DECISIONS.md`

## Quality Checklist

- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run typecheck` passes across all workspaces under strict mode
- [ ] `npm test` passes
- [ ] No invented data: all species, regimes, and council facts have primary `sourceUrl` and `sourceRetrievedAt`
- [ ] Zero DOM, Node, or network dependencies in `packages/core`
- [ ] Commits follow Conventional Commits format (`type(scope): message`)
