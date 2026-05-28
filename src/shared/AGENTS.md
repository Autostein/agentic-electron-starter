# Directory Rules: `src/shared`

- Put runtime-free cross-cutting primitives here.
- Shared code may be used by core, contracts, main, preload, renderer, and infrastructure.
- Keep shared code small, generic, and serializable where possible.
- Do not put feature logic, orchestration, adapters, UI, or IPC handlers here.
- Do not import Electron, React, Node APIs, SQLite, Sandcastle, core, contracts, Electron folders, or infrastructure.
