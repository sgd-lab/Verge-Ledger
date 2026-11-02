# Deploying the static build to GitHub Pages

Guides only. No paid service is required for this route: GitHub Pages
hosting of a public repository is free, and the app itself runs in
local-only mode (no server, no API) in this configuration.

## What already exists

`.github/workflows/pages.yml` builds the web app and deploys
`apps/web/dist` to GitHub Pages on every push to `main`. The build step
sets `VITE_API_URL` to an empty string, which puts the app in local-only
mode: all surveys, workspaces and council facts live in the visitor's
own browser (IndexedDB) and nothing is sent anywhere.

## Why no workflow change is needed: hash routing + relative base

Verge Ledger is a single-page app with client-side routes (Survey,
Advisor, Simulator, Councils, Export, Workspaces, Impact). GitHub
Pages serves static files only, so a normal browser-router deep link
such as `/Verge-Ledger/survey` would 404 on a direct visit or refresh
unless the workflow were edited to copy `index.html` to `404.html`.
Workflow files cannot be edited through this repo's GitHub App
connection (403: the installation lacks the Workflows permission),
and editing them by hand is not required, because the app avoids the
problem entirely:

- **Hash routing** (`apps/web/src/App.tsx` uses `HashRouter`):
  routes live after `#`, e.g. `https://sgd-lab.github.io/Verge-Ledger/#/survey`.
  The server only ever sees `index.html`, so no 404 fallback is
  needed and the workflow on GitHub — which has no 404 step — deploys
  a working demo as-is.
- **Relative base** (`apps/web/vite.config.ts`, `base: './'`):
  assets and the PWA manifest (`start_url`, `scope`, icon) are
  relative, so the same build works at the domain root, at the
  project subpath `/Verge-Ledger/`, or in a local preview, with no
  build-time base to set.

Trade-off: demo URLs carry a `#` (`/#/survey` instead of
`/survey`). If the workflow is ever edited by hand to add the 404
fallback, the app can be reverted to `BrowserRouter` with a
`/Verge-Ledger/` basename and an absolute base — but that is
optional, not a blocker.

## Local-only build (reproduce it by hand)

```sh
npm ci
VITE_API_URL='' npm run build -w @verge-ledger/web
# Static output: apps/web/dist — upload or serve that directory as-is.
```

## Security headers: GitHub Pages cannot set them from the repo

GitHub Pages does **not** let a repository set custom HTTP response
headers. The built `index.html` therefore carries the Content-Security
Policy as a `<meta http-equiv>` tag (see `apps/web/index.html`), which
is the only CSP mechanism available on this host. That meta CSP is a
fallback, not a replacement for headers:

- It cannot set `Strict-Transport-Security`,
  `X-Content-Type-Options`, `Referrer-Policy` or
  `Permissions-Policy`, and it does not apply to the service worker
  script itself the way a header would.
- If you later move to a host that supports headers (see
  `deploy/static-hosting.md`), send the same CSP as a real header
  and keep the meta tag as a defence-in-depth fallback. If
  `VITE_API_URL` ever points at a real API origin, that origin must be
  added to `connect-src` in the header version of the policy.

## PWA on Pages

The build emits `manifest.webmanifest`, `registerSW.js` and `sw.js`
(via `vite-plugin-pwa`). The service worker precaches the app shell
(31 entries in the v0.1.0 build) and runtime-caches map tiles with a
cap of 50 entries / 7 days (`map-tiles` cache). Tiles still come from
OpenStreetMap / CARTO at runtime; see the production tile-provider
question in `docs/OPEN-QUESTIONS.md` (OQ-1) before any public launch.

## What this deployment does NOT do

- No API, no sync, no accounts. The optional Fastify API
  (`apps/api`) is not deployed by this workflow and is not needed.
- No ecologist review, pilot data, or council facts are included:
  the council registry starts empty and demo data is only loaded when
  a visitor presses "Load demo workspace".


## Manual steps the repo cannot do for you

The workflow above is ready, but GitHub Pages itself must be switched
on by a repo admin, and on a Free plan the repo must be public:

1. **Repo visibility (Free plan only):** GitHub Pages cannot publish
   from a private repo on a Free plan — it needs Pro/Team or a public
   repo. If the account is on Free, make the repo public first
   (Settings > Danger Zone > Change visibility). The published site
   is public either way; making the repo public also makes the source
   public, so check nothing private is in it first.
2. **Enable Pages:** Settings > Pages > Build and deployment >
   Source: **GitHub Actions**. After that, every push to `main` runs
   the workflow above and deploys automatically. The live URL is
   `https://sgd-lab.github.io/Verge-Ledger/`.
3. **Verify live:** open the URL, then a hash deep link such as
   `https://sgd-lab.github.io/Verge-Ledger/#/survey` — it should
   render the Survey page, not a GitHub 404. A plain
   `/Verge-Ledger/survey` (no `#`) will still 404 by design, since
   there is no 404 fallback; share only `#/` links.
