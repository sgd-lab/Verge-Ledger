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

## SPA fallback

Verge Ledger is a single-page app with client-side routes (`/survey`,
`/advisor`, `/simulator`, `/councils`, `/export`, `/workspaces`,
`/impact`). GitHub Pages serves static files only: a direct visit or
refresh on `/survey` would 404 unless the host returns `index.html`
for unknown paths.

The existing workflow does **not** add a fallback file. Before relying
on deep links, add one of these to the deployed artifact (both are
repo-side, static, and free):

1. **Preferred, no workflow change:** add a `404.html` that is a copy
   of the built `index.html` (same directory as `index.html` in
   `apps/web/dist`). GitHub Pages serves `404.html` for unknown paths,
   and the router then renders the requested route. The copy must be
   regenerated on every build because asset hashes change.
2. **Alternative:** add a build step to the Pages workflow that copies
   `apps/web/dist/index.html` to `apps/web/dist/404.html` before the
   upload-pages-artifact step, e.g.
   `cp apps/web/dist/index.html apps/web/dist/404.html`.

Until one of these is in place, share only the site root URL; in-app
navigation works, but a bookmarked or refreshed deep link may 404.
This is a known gap, not a code bug — see `docs/HANDOFF.md`.

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
  `deploy/hostinger-static.md`), send the same CSP as a real header
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
