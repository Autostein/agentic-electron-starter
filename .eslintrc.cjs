module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        noWarnOnMultipleProjects: true,
        project: [
          './tsconfig.main.json',
          './tsconfig.preload.json',
          './tsconfig.renderer.json',
          './tsconfig.test.json',
        ],
      },
    },
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-unresolved': 'off',
  },
  overrides: [
    {
      files: ['src/electron/renderer/**/*.{ts,tsx}'],
      env: { browser: true },
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: ['electron', 'fs', 'path', 'crypto', 'os', 'child_process'],
            patterns: [
              'node:*',
              '@/electron/main/*',
              '@/electron/preload/*',
              '@/infrastructure/main/*',
              '../../main/*',
              '../../preload/*',
            ],
          },
        ],
      },
    },
    {
      files: ['src/electron/main/**/*.ts', 'src/infrastructure/main/**/*.ts', 'scripts/**/*.ts'],
      env: { node: true },
    },
    {
      files: ['src/electron/preload/**/*.ts'],
      env: { browser: true },
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['@/domain/*', '@/application/*', '@/infrastructure/main/*', '@/electron/main/*', '@/electron/renderer/*'],
          },
        ],
      },
    },
    {
      files: ['*.config.ts', '*.config.cjs'],
      env: { node: true },
    },
  ],
};
