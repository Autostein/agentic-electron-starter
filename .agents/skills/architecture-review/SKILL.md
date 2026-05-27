---
name: architecture-review
description: Use before merging broad changes or when asked to review Electron process and dependency boundaries.
---

# Architecture Review

Check process and layer boundaries.

## Run

```bash
pnpm typecheck
pnpm lint
pnpm lint:arch
pnpm test
```

## Review

- Renderer imports no Electron, Node, preload, main, or privileged infrastructure.
- Preload exposes typed wrappers only and no raw IPC.
- IPC contracts contain schemas/channels/DTOs only.
- Domain/application stay runtime-free.
- Main/infrastructure adapters do not import renderer code.
- New IPC capabilities validate inputs and have tests.
