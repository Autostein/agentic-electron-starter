# Directory Rules: `src/electron/main/bootstrap`

- Put dependency composition and IPC registration composition here.
- Keep Electron lifecycle code in `src/electron/main/main.ts`.
- Prefer capability-specific dependency factories over one giant composition file.
- Do not put business logic or domain policy here.
- Do not implement IPC handlers here; register capability handlers from `src/electron/main/ipc`.
