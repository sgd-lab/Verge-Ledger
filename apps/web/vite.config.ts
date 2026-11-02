import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Relative base so the built app works at any path — domain root,
// a GitHub Pages project subpath (/Verge-Ledger/), or a preview
// server — without needing a workflow change to set a base.
// Trade-off, documented in deploy/github-pages.md: this pairs with
// HashRouter in App.tsx, so routes live after '#'.
const pagesBase = process.env.VITE_PAGES_BASE ?? './';

export default defineConfig({
  base: pagesBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the app shell (bundled JS/CSS/HTML); map tiles are NOT
      // precached — they are cached at runtime, capped below.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            // OpenStreetMap + CARTO fallback tiles used by VergeMap.
            urlPattern: /^https:\/\/(tile\.openstreetmap\.org|[^/]+\.basemaps\.cartocdn\.com)\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                // Cap from the quality brief: ~50 tile entries, 7 days.
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Verge Ledger',
        short_name: 'Verge Ledger',
        description:
          'Open-source, offline-first toolkit for parish councils and volunteers in England for road verge habitat evidence and cut-timing.',
        theme_color: '#065f46',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: pagesBase,
        scope: pagesBase,
        icons: [
          {
            src: `${pagesBase}favicon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
});
