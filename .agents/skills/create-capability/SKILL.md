---
name: create-capability
description: Use when adding a whole new app capability across core, IPC contracts, main IPC, preload bridge, renderer, and optional infrastructure.
---

# Create Capability

Use this workflow when a feature needs a new end-to-end capability.

## Steps

1. Inspect the closest existing capability first; `notes` is the smallest full example.
2. Add pure domain and application code under `src/core/<capability>`.
   Put invariants, transitions, value objects, and policies in `domain`; put orchestration across ports in `application`.
3. Add IPC contracts under `src/contracts/ipc`.
   Keep channels, Zod schemas, DTOs, and result types serializable.
4. Add infrastructure adapters under `src/infrastructure/main` only for privileged side effects.
5. Add main IPC handlers under `src/electron/main/ipc`.
   Validate input, delegate to use-cases, and use `registerIpcHandler`.
6. Wire dependencies in `src/electron/main/bootstrap` with capability-specific factories when useful.
7. Add `DesktopApi` methods and bridge mappings under `src/electron/preload/bridge`.
   Compose in `preload.ts` only for a new namespace.
8. Add renderer client, hooks, and UI under `src/electron/renderer/features/<capability>`.
   Renderer code calls `window.desktop`, never IPC or Electron directly.
9. Add focused tests for contracts, domain/use-cases, handlers, bridges, and renderer behavior based on risk.
10. Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:arch`, and `pnpm test`.
