module.exports = {
  forbidden: [
    {
      name: 'renderer-no-privileged-runtime',
      severity: 'error',
      from: { path: '^src/electron/renderer' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs$|path$|crypto$|os$|child_process$|src/electron/(main|preload)|src/infrastructure/main)',
      },
    },
    {
      name: 'preload-only-bridge-and-contracts',
      severity: 'error',
      from: { path: '^src/electron/preload' },
      to: {
        path: '^(@ai-hero/sandcastle|src/(domain|application|infrastructure/main|electron/main|electron/renderer))',
      },
    },
    {
      name: 'ipc-contracts-are-runtime-free',
      severity: 'error',
      from: { path: '^src/infrastructure/ipc' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs$|path$|crypto$|os$|child_process$|src/(domain|application|infrastructure/main|electron))',
      },
    },
    {
      name: 'domain-and-application-are-runtime-free',
      severity: 'error',
      from: { path: '^src/(domain|application)' },
      to: {
        path: '^(@ai-hero/sandcastle|electron|node:|fs$|path$|crypto$|os$|child_process$|react$|react-dom$|src/(electron|infrastructure))',
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
