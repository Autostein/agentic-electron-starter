# Directory Rules: `src/electron/preload/bridge`

- Put feature-specific `window.desktop` bridge mappings here.
- Use `invokeIpc` for request/response IPC.
- Subscription APIs must validate incoming event payloads before calling renderer callbacks.
- Subscription APIs must return an unsubscribe function.
- Do not expose raw `ipcRenderer`, generic `send`, or arbitrary channel invocation.
- Do not put business logic here.
