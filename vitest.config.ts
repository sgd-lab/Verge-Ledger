import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['packages/*/src/**/*.{ts,tsx}', 'apps/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/tests/**',
        '**/dist/**',
        '**/node_modules/**',
        'apps/web/src/main.tsx',
        'apps/api/src/server.ts',
      ],
      thresholds: {
        // Enforce Phase 1 Gate 1 requirement: core coverage >= 90%
        'packages/core/src/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        // Enforce web and api coverage >= 70% per AGENTS.md
        'apps/web/src/**': {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
        'apps/api/src/**': {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
      },
    },
    // Multi-project workspace definition
    projects: [
      {
        test: {
          name: 'core',
          root: './packages/core',
          environment: 'node',
          include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'data',
          root: './packages/data',
          environment: 'node',
          include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'web',
          root: './apps/web',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'api',
          root: './apps/api',
          environment: 'node',
          include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        },
      },
    ],
  },
});
