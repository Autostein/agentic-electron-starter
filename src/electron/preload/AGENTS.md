# Directory Rules: `src/electron/preload`

- Put thin `contextBridge` API mapping here.
- Expose typed wrappers only.
- Do not expose raw `ipcRenderer` or add business logic.
