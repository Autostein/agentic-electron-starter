---
name: add-domain-rule
description: Use when adding or changing a core invariant, state transition, value object, naming policy, domain event, or pure business rule.
---

# Add Domain Rule

Use this workflow when behavior belongs in the runtime-free core model.

## Placement

- Reusable invariant, state transition, value object, pure policy, or domain event: `src/core/<capability>/domain`.
- Orchestration across repositories, runners, Docker, Git, IDs, clocks, logs, or event publication: `src/core/<capability>/application`.
- Real-world side effect: `src/infrastructure/main`.
- Transport shape or payload validation: `src/contracts/ipc` or IPC handler.
- Renderer-only display transformation: renderer feature code.

## Steps

1. Express the rule as pure code with explicit inputs and outputs.
2. Prefer domain-produced snapshots, transitions, or events over raw business-state mutation parameters.
3. Keep domain code free of Electron, React, Node APIs, IPC contracts, SQLite, browser APIs, and infrastructure.
4. Update application use-cases to call the domain rule instead of duplicating it.
5. Add direct domain tests for valid cases, invalid cases, and boundary cases.
6. Run `pnpm typecheck`, `pnpm lint:arch`, and relevant tests.
