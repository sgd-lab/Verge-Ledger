import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // 1. Global Ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.agents/**',
      'playwright-report/**',
      'test-results/**',
      '*.config.js',
      '*.config.ts',
      '**/vite.config.ts',
      '**/tailwind.config.js',
      '**/postcss.config.js',
    ],
  },

  // 2. Base JavaScript Recommended
  js.configs.recommended,

  // 3. TypeScript Recommended across all TS / TSX files
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // 4. Global TypeScript Rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  },

  // 5. ARCHITECTURAL BOUNDARY: packages/core Zero-Dependency Guard
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'packages/core must have zero DOM/UI dependencies.' },
            { name: 'react-dom', message: 'packages/core must have zero DOM/UI dependencies.' },
            { name: 'fs', message: 'packages/core must have zero Node runtime dependencies.' },
            { name: 'node:fs', message: 'packages/core must have zero Node runtime dependencies.' },
            { name: 'path', message: 'packages/core must have zero Node runtime dependencies.' },
            {
              name: 'node:path',
              message: 'packages/core must have zero Node runtime dependencies.',
            },
            { name: 'http', message: 'packages/core must have zero network dependencies.' },
            { name: 'node:http', message: 'packages/core must have zero network dependencies.' },
            { name: 'https', message: 'packages/core must have zero network dependencies.' },
            { name: 'node:https', message: 'packages/core must have zero network dependencies.' },
          ],
          patterns: [
            {
              group: ['node:*', 'express', 'fastify', 'dexie', 'leaflet'],
              message: 'packages/core must remain pure domain logic without platform dependencies.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'packages/core must not access browser window object.' },
        { name: 'document', message: 'packages/core must not access DOM document object.' },
        { name: 'localStorage', message: 'packages/core must not access browser localStorage.' },
        {
          name: 'sessionStorage',
          message: 'packages/core must not access browser sessionStorage.',
        },
        { name: 'fetch', message: 'packages/core must not make network requests.' },
      ],
    },
  },

  // 6. React & Browser Configuration (apps/web)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // 7. Node Service Configuration (apps/api)
  {
    files: ['apps/api/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 8. Test Files Configuration (Vitest & Playwright)
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.{ts,tsx}', 'e2e/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 9. Prettier Rules Override
  prettierConfig,
);
