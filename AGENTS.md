# Agent Instructions

- Use PNPM, never NPM.
- Keep responses concise.

## Architecture

This is an Electron + React desktop app using a light hexagonal structure for a local agent orchestration cockpit.

- `src/domain` contains pure entities and ports.
- `src/application/use-cases` contains business orchestration.
- `src/infrastructure/ipc` contains channel constants, Zod schemas, and DTO types.
- `src/infrastructure/main` contains SQLite and privileged adapters.
- `src/electron/main` wires Electron lifecycle and IPC handlers.
- `src/electron/main/agent-runner-worker.ts` is the isolated utility-process worker that imports Sandcastle.
- `src/electron/preload` exposes a narrow typed bridge.
- `src/electron/renderer` contains React Router Data Mode UI.

## Hard Rules

- Renderer code must not import Electron, Node APIs, preload, main, or privileged infrastructure.
- Renderer code calls desktop capabilities through `window.desktop`.
- Preload must not expose raw `ipcRenderer`.
- Preload must stay thin and contain no business logic.
- IPC handlers validate input with shared contracts.
- Domain and application code must not depend on Electron, React, Node, IPC, SQLite, or browser APIs.
- Main and infrastructure adapters must not import renderer code.
- Sandcastle must stay in the utility-process worker path; renderer, preload, domain, application, and IPC contracts must not import it.
- Provider auth is CLI-auth only in v1. Do not add API key storage unless the architecture is revised.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Architecture check: `pnpm lint:arch`

## Done Means

- Relevant tests pass.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm lint:arch` passes.
- New IPC APIs include typed contracts, runtime validation, preload mapping, and tests.
