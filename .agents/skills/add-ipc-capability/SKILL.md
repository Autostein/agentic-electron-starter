---
name: add-ipc-capability
description: Use when exposing a new main-process capability to the renderer through the typed preload bridge and validated IPC contracts.
---

# Add IPC Capability

Use this workflow when renderer code needs a new desktop capability.

## Steps

1. Add or update a Zod contract in `src/infrastructure/ipc`.
2. Add or update the domain port and application use-case.
3. Implement the privileged adapter in `src/infrastructure/main` if needed.
4. Add a main IPC handler in `src/electron/main/ipc` that validates input and delegates to a use-case.
5. Add the method to `DesktopApi` and map it in `src/electron/preload/preload.ts`.
6. Add a renderer feature client/hook that calls `window.desktop`.
7. Run `pnpm typecheck`, `pnpm lint:arch`, and relevant tests.

Do not expose raw `ipcRenderer` or import Electron/Node from renderer code.
