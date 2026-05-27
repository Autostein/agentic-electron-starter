# Agentic Electron Starter

Electron + React desktop app template with typed IPC, SQLite persistence, and agent-oriented project guidance.

## Stack

- Electron Forge + Vite
- React 19 + React Router Data Mode
- React Query for renderer data
- `contextBridge` preload API
- SQLite via built-in `node:sqlite`
- Drizzle Kit for schema-driven migration generation
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
