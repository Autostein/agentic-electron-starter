---
name: security-review
description: Use when reviewing changes that touch Docker, Sandcastle, agent execution, runtime profiles, provider auth, worktrees, IPC exposure, or privileged Electron APIs.
---

# Security Review

Use this checklist for security-sensitive desktop and agent-runtime changes.

## Run

```bash
pnpm typecheck
pnpm lint
pnpm lint:arch
pnpm test
```

## Review

- Renderer cannot import Electron, Node, preload, main, core, or privileged infrastructure.
- Preload exposes capability methods only; no raw `ipcRenderer`, generic send, or arbitrary channel invocation.
- IPC payloads, SQLite rows, logs, and renderer state do not carry API keys or secrets.
- Provider auth remains CLI-auth only unless the architecture is explicitly revised.
- CLI auth mounts are explicit, provider-scoped, and read-only where possible.
- Runtime profile paths and worktrees stay under app-owned locations and reject traversal or symlink escape.
- Dockerfile edits are treated as trusted local code and are not silently fetched from remote input.
- Sandcastle imports stay in the utility-process worker path.
- Subscriptions validate event payloads before renderer callbacks and return unsubscribe functions.
