---
name: add-renderer-route
description: Use when adding a React Router Data Mode route to the Electron renderer.
---

# Add Renderer Route

Use React Router Data Mode in `src/electron/renderer/router.tsx`.

## Steps

1. Add a thin route component under `src/electron/renderer/routes`.
2. Put feature UI, clients, hooks, and view-model code under `src/electron/renderer/features/<feature>`.
3. Load desktop data through React Query hooks calling a feature client.
4. Register the route in `router.tsx`.
5. Keep route components thin; do not call Electron, Node, or IPC directly.
6. Add a renderer test with mocked `window.desktop` when behavior changes.
