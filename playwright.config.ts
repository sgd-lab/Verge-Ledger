import { defineConfig } from '@playwright/test';

// E2E runs against the production static build, not the dev server, so
// the CSP meta tag, PWA manifest and code-split chunks are exercised as
// shipped. Build first: `npm run build -w @verge-ledger/web` (or the
// root `npm run build`), then `npm run test:e2e` from the repo root.
// Browsers are NOT installed by this repo: CI installs Chromium with
// `npx playwright install --with-deps chromium` (see .github/workflows/ci.yml).
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -w @verge-ledger/web -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
