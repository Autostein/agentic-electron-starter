import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('dependency cruiser config', () => {
  it('enforces core Electron process boundaries', () => {
    const config = require('../../dependency-cruiser.config.cjs') as {
      forbidden: Array<{ name: string }>;
    };

    expect(config.forbidden.map((rule) => rule.name)).toEqual(
      expect.arrayContaining([
        'renderer-no-privileged-runtime',
        'preload-only-bridge-and-contracts',
        'ipc-contracts-are-runtime-free',
        'domain-and-application-are-runtime-free',
        'main-never-imports-renderer-or-preload',
      ]),
    );
  });
});
