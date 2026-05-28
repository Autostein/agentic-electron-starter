module.exports = {
  forbidden: [
    {
      name: 'renderer-no-privileged-runtime',
      severity: 'error',
      from: { path: '^src/electron/renderer' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs$|path$|crypto$|os$|child_process$|src/(core|electron/(main|preload)|infrastructure/main))',
      },
    },
    {
      name: 'preload-only-bridge-and-contracts',
      severity: 'error',
      from: { path: '^src/electron/preload' },
      to: {
        path: '^(@ai-hero/sandcastle|src/(core|infrastructure/main|electron/main|electron/renderer))',
      },
    },
    {
      name: 'ipc-contracts-are-runtime-free',
      severity: 'error',
      from: { path: '^src/contracts/ipc' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs$|path$|crypto$|os$|child_process$|src/(core|infrastructure|electron))',
      },
    },
    {
      name: 'shared-is-runtime-free',
      severity: 'error',
      from: { path: '^src/shared' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs(?:/|$)|path(?:/|$)|crypto(?:/|$)|os(?:/|$)|child_process(?:/|$)|react$|react-dom$|src/(core|contracts|electron|infrastructure))',
      },
    },
    {
      name: 'core-is-runtime-free',
      severity: 'error',
      from: { path: '^src/core' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs$|path$|crypto$|os$|child_process$|react$|react-dom$|src/(contracts|electron|infrastructure))',
      },
    },
    {
      name: 'main-never-imports-renderer-or-preload',
      severity: 'error',
      from: { path: '^src/(electron/main|infrastructure/main)' },
      to: { path: '^src/electron/(renderer|preload)' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '\\.test\\.(ts|tsx)$',
    },
    tsConfig: {
      fileName: 'tsconfig.base.json',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
};
