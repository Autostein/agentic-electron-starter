# Directory Rules: `src/core`

- Organize pure domain and application code by capability.
- Put entities and pure port interfaces under `domain`.
- Put orchestration, application ports, and read models under `application`.
- Do not import Electron, React, Node APIs, IPC contracts, SQLite, browser APIs, or privileged infrastructure.
