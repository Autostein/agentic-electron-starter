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
- Renderer calls desktop capabilities only through `window.desktop`.
- Preload exposes typed wrappers only and no raw IPC, generic send, or arbitrary channel invocation.
- Preload bridge modules use `invokeIpc` for request/response methods.
- Preload subscriptions validate event payloads and return unsubscribe functions.
- IPC contracts contain schemas/channels/DTOs/envelopes only and stay serializable.
- Shared code stays runtime-free and does not become a feature-logic dumping ground.
- Core domain/application stay runtime-free.
- Core domain owns reusable invariants, state transitions, value objects, and pure policies.
- Core application coordinates repositories, runners, Docker, Git, IDs, clocks, log paths, and event publication.
- Repository ports avoid raw business-state mutation parameters when a domain-produced snapshot or transition can express the write.
- Bootstrap code composes dependencies and IPC registration only; handlers stay in `src/electron/main/ipc`.
- Sandcastle imports stay in the utility-process worker path.
- Main/infrastructure adapters do not import renderer code.
- Runtime profile paths stay app-owned, no secrets cross IPC or SQLite, and CLI auth mounts stay explicit.
- New IPC capabilities validate inputs and have tests.
