export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'test', 'refactor', 'chore', 'ci', 'perf', 'build'],
    ],
    'scope-empty': [0],
    'scope-enum': [
      2,
      'always',
      [
        'repo',
        'core',
        'data',
        'web',
        'api',
        'e2e',
        'docs',
        'tooling',
        'community',
        'templates',
        'security',
        'a11y',
        'deploy',
        'release',
      ],
    ],
  },
};
