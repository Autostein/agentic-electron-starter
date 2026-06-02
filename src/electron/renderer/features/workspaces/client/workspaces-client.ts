import type {
  CreateWorkspaceInput,
  GetWorkspaceInput,
  PickWorkspaceFolderInput,
  RemoveWorkspaceFolderInput,
  UpdateWorkspaceFolderInput,
  UpdateWorkspaceInput,
} from '@/contracts/ipc/workspaces.contract';

export function createWorkspace(input: CreateWorkspaceInput) {
  return window.desktop.workspaces.create(input);
}

export function updateWorkspace(input: UpdateWorkspaceInput) {
  return window.desktop.workspaces.update(input);
}

export function listWorkspaces() {
  return window.desktop.workspaces.list();
}

export function getWorkspace(input: GetWorkspaceInput) {
  return window.desktop.workspaces.get(input);
}

export function pickWorkspaceFolder(input: PickWorkspaceFolderInput) {
  return window.desktop.workspaces.pickFolder(input);
}

export function updateWorkspaceFolder(input: UpdateWorkspaceFolderInput) {
  return window.desktop.workspaces.updateFolder(input);
}

export function removeWorkspaceFolder(input: RemoveWorkspaceFolderInput) {
  return window.desktop.workspaces.removeFolder(input);
}
