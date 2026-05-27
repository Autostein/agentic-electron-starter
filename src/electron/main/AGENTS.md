# Directory Rules: `src/electron/main`

- Put Electron lifecycle, window setup, dependency composition, and IPC registration here.
- IPC handlers validate input and delegate to use-cases.
- Do not put provider protocol logic, renderer UI, or domain policy here.
