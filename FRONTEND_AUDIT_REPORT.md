# Frontend audit and fix report — Verge Ledger web app

Date: 2026-11-02. Method: every file under `apps/web/src` was read
(pages, components, hooks, db, lib), not just docs. Local copy only;
nothing was pushed to GitHub.

## What was wrong

### Map — the main complaint
1. **The map was never shown.** `VergeMap`, `SegmentLayer`,
   `DrawingToolbar`, `GpsMarker`, `useSegmentDrawing` and
   `useGeolocation` existed but no page imported them. The Survey page
   only offered coordinate entry, so there was no map to lag or render.
2. **Map recreated on every parent re-render.** `VergeMap`'s effect
   depended on `center`/`zoom`/`tileUrl`, so a new centre array destroyed
   the map, dropped all tiles/layers, and re-downloaded everything.
3. **Drawing rebuilt everything on every mousemove.** `SegmentLayer`
   cleared and re-added every saved polyline whenever the in-progress
   point moved. `useSegmentDrawing` set state on every mousemove.
4. **Resize feedback loop.** `VergeMap` called `invalidateSize()` on
   every `ResizeObserver` notification, and Leaflet's own layout work
   can trigger the observer again.
5. **GPS tracking stopped after the first fix.** `useGeolocation`
   stored the watch id in state, so starting tracking re-ran the
   auto-start effect, which cleared the just-created watch.
6. **GPS marker flickered.** `GpsMarker` removed and recreated its
   marker/circle in the effect cleanup on every position update.
7. **Map could cover the sticky header.** Leaflet panes use z-index up
   to 1000; the app header is z-30.

### Other defects found by reading the code
- `CoordinateEntryForm` said "at least 10 m" while validation is 5–500 m.
- The header hard-coded a "Local Only" badge instead of the real sync
  status (the `SyncStatusBadge` component was also unused).
- Advisor inputs stayed on their initial defaults when the selected
  verge changed, until the user pressed "Use this verge" — advice could
  be generated for the wrong verge.
- The evidence pack for "All segments" silently used the first segment.
- `Dialog` and `Tabs` remain unused dead code (harmless, left alone).

## What was fixed
- `VergeMap`: map created once; view changes use `setView` on the
  existing map; canvas renderer (`preferCanvas`); resize handler only
  invalidates when the size actually changed, once per animation frame;
  tile fallback re-armed with a proper error handler and counter reset.
- `SegmentLayer`: one persistent layer group; saved segments rebuild
  only when segments/selection change; the draft line is a single
  polyline updated in place; the select callback is held in a ref so
  it cannot trigger a rebuild.
- `GpsMarker`: marker/circle updated in place, removed only when the
  position becomes null.
- `useGeolocation`: watch id moved to a ref; start/stop are stable and
  do not restart or clear each other.
- `useSegmentDrawing`: rubber-band updates throttled to one animation
  frame.
- `SurveyPage`: the map is now rendered on the Survey page with saved
  segments (tap one to select it), a drawing toolbar, GPS start, and a
  map/coordinate toggle. Drawing a valid 5–500 m segment feeds the
  existing road-details save flow; coordinate entry remains as fallback.
- `index.css`: `.leaflet-container { z-index: 1 }` so the map no longer
  covers the header.
- `CoordinateEntryForm`: copy corrected to 5 m.
- `RootLayout`: header now shows the real sync status via
  `SyncStatusBadge` + `useSyncStatus` (still "Local Only" by default).
- `AdvisorPage`: defaults auto-apply when the selected verge changes.
- `ExportPage`: evidence-pack message now says it packs the first
  segment when "All segments" is selected.

## Verification (all re-run after the fixes)
- `npm run lint` — pass, zero warnings
- `npm run typecheck` — pass
- `npm test` — 135 passed, 15 files, no regressions
- Production build (`npm run build -w @verge-ledger/web`) — pass,
  1644 modules; bundle is 692 kB, over Vite's 500 kB advisory warning
  only (build still passes; code-splitting not added)
- Dev server restarted and checked: `http://127.0.0.1:5173/` — HTTP 200

## Not verified by this audit
- Visual rendering in a real browser could not be confirmed here: the
  Muse browser session previously failed to open any tab, and no
  public link was created. The server, build, tests, and code paths
  above are verified; a visual check on a real device/browser is still
  the last step before calling the map "seen working".
- No map tiles are bundled; tiles still load from OpenStreetMap (with
  a Carto fallback) at runtime, so the map needs network access to
  show tiles, even though survey data itself is stored locally.
