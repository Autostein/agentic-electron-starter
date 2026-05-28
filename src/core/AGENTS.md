# Directory Rules: `src/core`

- Organize pure domain and application code by capability.
- Put entities and pure port interfaces under `domain`.
- Put orchestration, application ports, and read models under `application`.
- Do not import Electron, React, Node APIs, IPC contracts, SQLite, browser APIs, or privileged infrastructure.
- Domain owns reusable invariants, state transitions, value objects, and pure policies.
- Application use cases coordinate repositories, runners, Docker, Git, IDs, clocks, log paths, and event publication.
- Prefer moving reusable business rules into domain instead of duplicating them in use cases.
- Repository ports should avoid raw business-state mutation parameters when a domain-produced snapshot or transition can express the same write.
