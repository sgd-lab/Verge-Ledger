# Contributing to Verge Ledger

Thank you for contributing. This project values accuracy over volume.

## Ways to help

- **Fix or source the indicator species list**: Verify species, botanical references, and weights (see [`docs/DATA.md`](docs/DATA.md)).
- **Add or correct council facts**: Submit primary highway authority cutting policies with URLs and retrieval dates.
- **Report bugs and accessibility problems**: Test keyboard navigation, screen reader support, or unexpected errors.
- **Share field feedback**: Walk a roadside safely and test the five-minute survey workflow.

## Ground rules

1. **No invented data**: Every species, guidance statement, and council fact needs a source URL and a retrieval date. If you cannot verify something, do not commit it.
2. **Safety first**: Do not suggest features or workflows that encourage standing on the carriageway, surveying fast roads without footways, or altering verges without highway authority permission.
3. **Keep core logic pure**: `packages/core` must have zero DOM, Node, or network dependencies.
4. **Honest uncertainty**: Show uncertainty clearly. Never present triage heuristics as scientific certainty.

## Development workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Verify all local quality checks before opening a pull request:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

Format: `<type>(<scope>): <summary>` (imperative mood, 72 characters or fewer)

Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `perf`, `build`.

Examples:

- `feat(core): add refuge overlay to advisor`
- `fix(web): ensure touch target size >= 44px on survey button`
- `docs(data): add source citation for common knapweed`

## Pull requests

- Keep pull requests focused on a single change.
- Include unit, component, or integration tests.
- Reference the relevant feature area (e.g. survey, advisor) where applicable.
- Update documentation in `docs/` if behavior changes.
- Ensure all CI checks pass.

## Proposing council facts

To propose new or corrected council mowing facts, please use the [Council Fact Issue Template](.github/ISSUE_TEMPLATE/council_fact.yml).
