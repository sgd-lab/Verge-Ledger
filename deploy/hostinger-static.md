# Deploying the static build to Hostinger (static hosting)

Guides only. This describes the static-upload route for a Hostinger
shared/static plan. Nothing here requires a paid upgrade: the app runs
fully in local-only mode without any server component. The API is
optional (see below) and only applies if the plan supports Node.

## 1. Build locally

```sh
npm ci
VITE_API_URL='' npm run build -w @verge-ledger/web
# Static output: apps/web/dist
```

With `VITE_API_URL` empty, the app is local-only: surveys, workspaces
and council facts stay in the visitor's browser (IndexedDB).

## 2. Upload

Upload the **contents** of `apps/web/dist` (not the `dist` folder
itself) to the site's public directory (typically `public_html`), so
that `index.html`, `manifest.webmanifest`, `sw.js` and `assets/` sit
at the web root. Re-upload on every release: asset filenames contain
content hashes, so stale files are harmless but the new `index.html`
must match the new hashed assets.

## 3. SPA fallback (.htaccess)

Verge Ledger is a single-page app (`/survey`, `/advisor`, `/simulator`,
`/councils`, `/export`, `/workspaces`, `/impact`). Without a fallback,
a refresh or direct visit on any of those paths returns 404. Put this
in `.htaccess` in the same directory as `index.html` (Apache, as used
by Hostinger shared hosting):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Serve real files and directories directly (assets, manifest, sw.js).
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  # Everything else is a client-side route: serve the app shell.
  RewriteRule ^ index.html [L]
</IfModule>
```

Do not rewrite requests for existing files: the service worker
(`sw.js`), the manifest and hashed assets must be served as themselves
or offline support breaks.

## 4. Caching: long cache for hashed assets only

Hashed assets under `assets/` are immutable (their filename changes
when their content changes), so they can be cached for a long time.
`index.html`, `manifest.webmanifest` and `sw.js` must **not** be
long-cached, or visitors will keep the old shell after a release:

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  # Hashed, immutable assets: 1 year.
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  # Shell files: always revalidate.
  <FilesMatch "^(index\.html|manifest\.webmanifest|sw\.js)$">
    ExpiresDefault "access plus 0 seconds"
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
```

If `mod_expires` is unavailable on the plan, the same result can be
achieved with `Header set Cache-Control` rules in `.htaccess`; the
principle is the same: hashed = long, shell = no-cache.

## 5. Security headers (send these as real HTTP headers)

Unlike GitHub Pages, an Apache host can send headers. Send the same
Content-Security-Policy that the built `index.html` carries as a meta
tag, plus the headers a meta tag cannot provide. Add to `.htaccess`
(or the panel's header settings if the plan offers them):

```apache
<IfModule mod_headers.c>
  Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org https://*.basemaps.cartocdn.com; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "geolocation=(self), camera=(), microphone=()"
</IfModule>
```

Notes:

- `style-src-attr 'unsafe-inline'` is deliberate: Leaflet positions
  map panes with inline styles, so blocking it would break the map.
  No inline `<script>` or `<style>` elements are used by the app.
- `geolocation=(self)` is required for the "Start at My Location"
  drawing option and GPS marker; the app works without it via manual
  coordinate entry.
- If `VITE_API_URL` ever points at a real API origin, that origin
  must be added to `connect-src` in the header above.

## 6. API: optional, only if the plan supports Node

The optional Fastify API (`apps/api`) is **not** part of the static
upload and is **not** needed for the app to work. Only consider it if
the hosting plan supports a persistent Node process:

- It stores data **in memory only** in v0.1.0 (see ADR-009 in
  `docs/DECISIONS.md`): all synced workspaces, council facts and
  counters are lost on restart. Do not use it for anything that must
  survive a restart until SQLite persistence lands
  (`docs/OPEN-QUESTIONS.md`, OQ-8).
- It needs `VERGE_ADMIN_KEY` set in the environment; without it,
  admin review fails closed (503).
- If the plan cannot run Node persistently, stay on the static,
  local-only deployment above — that is the supported v0.1.0 setup.

## 7. After deploying

- Open the site root, then refresh on `/survey` to confirm the SPA
  fallback works.
- Open DevTools → Application → Service Workers and confirm `sw.js`
  is registered and the manifest loads.
- Confirm a fresh visit with the network throttled still loads the
  shell from cache on the second visit (the PWA precache).
