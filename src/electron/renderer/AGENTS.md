# Directory Rules: `src/electron/renderer`

- Put React Router Data Mode routes, feature UI, renderer clients, hooks, and shared UI here.
- Calls to desktop capabilities go through `window.desktop`.
- Do not import Electron, Node APIs, preload, main, or privileged infrastructure.
