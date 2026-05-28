---
name: add-ipc-capability
description: Use when exposing a new main-process capability to the renderer through the typed preload bridge and validated IPC contracts.
---

# Add IPC Capability

Use this workflow when renderer code needs a new desktop capability.

## Steps

1. Add or update a Zod contract in `src/contracts/ipc`.
   Include channels, input schemas, output schemas or DTO types, and serializable result types.
2. Add or update domain behavior and application use-cases under `src/core/<capability>`.
3. Implement privileged adapters in `src/infrastructure/main` if needed.
4. Add a main IPC handler in `src/electron/main/ipc`.
   Validate input with the contract, delegate to a use-case, and register with `registerIpcHandler`.
5. Register the capability handler from `src/electron/main/bootstrap/register-ipc-handlers.ts`.
6. Add the method to `DesktopApi` and implement it in the relevant bridge under `src/electron/preload/bridge`.
   Use `invokeIpc` for request/response methods.
   Only compose it in `src/electron/preload/preload.ts` when adding a new `DesktopApi` namespace.
7. For subscriptions, validate incoming payloads and return an unsubscribe function.
8. Add a renderer feature client/hook that calls `window.desktop`.
9. Add tests for contracts, handler validation, preload unwrap/subscription behavior, domain, or use-case as appropriate.
10. Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:arch`, and relevant tests.

Do not expose raw `ipcRenderer` or import Electron/Node from renderer code.
