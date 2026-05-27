# Agentic Electron Starter

Electron + React desktop app template with typed IPC, SQLite persistence, and a Sandcastle-powered local agent orchestration cockpit.

## Stack

- Electron Forge + Vite
- React 19 + React Router Data Mode
- React Query for renderer data
- `contextBridge` preload API
- SQLite via built-in `node:sqlite`
- Drizzle Kit for schema-driven migration generation
- Sandcastle run orchestration in an Electron utility-process worker
- Docker sandbox image built from app-owned resources
- Zod-validated IPC contracts
- Vitest, ESLint, Dependency Cruiser

## Commands

```bash
pnpm env use 24
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm lint:arch
pnpm test
pnpm db:generate
pnpm db:migrate
```

This template requires Node 24. `.npmrc` uses `engine-strict=true`, and package scripts run `pnpm check:node` so the project fails fast on the wrong runtime.

Persistence uses Node's built-in `node:sqlite`, so there is no native npm SQLite addon and no Electron/Node ABI rebuild step.

Electron 42 downloads its binary lazily. App scripts run `pnpm ensure:electron` before Forge so local development and packaging do not race Electron's first-run download.

## Architecture

```text
src/
  domain/                 Pure entities and ports
  application/use-cases/  Business orchestration
  infrastructure/ipc/     IPC channels, schemas, DTOs
  infrastructure/main/    SQLite and privileged adapters
  electron/main/          Electron lifecycle and IPC registration
  electron/preload/       Typed contextBridge API
  electron/renderer/      React UI and routes
```

The golden feature is `notes`: route -> renderer client/hooks -> preload bridge -> Zod IPC contract -> main IPC handler -> use-case -> SQLite repository.

The primary workflow is agent runs:

```text
renderer route
  -> React Query feature client
  -> window.desktop.agentRuns
  -> Zod IPC contract
  -> Electron main IPC handler
  -> application use-case
  -> SQLite run repository
  -> utility-process Sandcastle worker
  -> Docker sandbox
```

Target repositories do not need `.sandcastle` files. The app creates a normal Git branch named `agentic/<run-id>-<slug>`, prepares an app-owned worktree under Electron `userData`, and runs Sandcastle in that worktree. Runs never auto-merge.

Provider auth is CLI-auth only in v1. Settings let users mount Claude/Codex config directories read-only into the Docker sandbox for the selected provider; no API keys are stored in SQLite, IPC, or Keychain.

Before first run, open Settings and build the default sandbox image. Docker must be installed and running.
