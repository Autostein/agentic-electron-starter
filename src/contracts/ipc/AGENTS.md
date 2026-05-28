# Directory Rules: `src/contracts/ipc`

- Put IPC channel constants, Zod schemas, DTO result types, and IPC result envelope types here.
- This folder is a serialization boundary, not a business or domain layer.
- Keep DTOs serializable and stable across main, preload, and renderer.
- Contracts may import runtime-free shared primitives such as app error DTOs.
- Do not expose domain entities directly when the renderer needs a different view model.
- Do not import Electron, React, Node APIs, core, infrastructure, main, preload, or renderer code.
