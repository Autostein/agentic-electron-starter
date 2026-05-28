export function listWorkspaces() {
  return window.desktop.workspaces.list();
}

export function pickWorkspace() {
  return window.desktop.workspaces.pick();
}
