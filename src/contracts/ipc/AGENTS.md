# Directory Rules: `src/contracts/ipc`

- Put IPC channel constants, Zod schemas, and serializable DTO types here.
- Keep this layer runtime-free.
- Do not import Electron, React, Node APIs, core code, main adapters, preload, or renderer.
