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
- Core domain/application stay runtime-free.
- Core domain owns reusable invariants, state transitions, value objects, and pure policies.
- Core application coordinates repositories, runners, Docker, Git, IDs, clocks, log paths, and event publication.
- Repository ports avoid raw business-state mutation parameters when a domain-produced snapshot or transition can express the write.
- Sandcastle imports stay in the utility-process worker path.
- Main/infrastructure adapters do not import renderer code.
- New IPC capabilities validate inputs and have tests.
