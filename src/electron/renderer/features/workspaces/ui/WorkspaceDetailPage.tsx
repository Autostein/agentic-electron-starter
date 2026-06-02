import type { FormEvent } from 'react';
import { useState } from 'react';
import { ArrowLeft, FolderGit2, FolderOpen, Play, Save, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router';
import type { WorkspaceFolderResult } from '@/contracts/ipc/workspaces.contract';
import { formatRendererError } from '@/electron/renderer/shared/errors';
import {
  usePickWorkspaceFolder,
  useRemoveWorkspaceFolder,
  useUpdateWorkspace,
  useUpdateWorkspaceFolder,
  useWorkspace,
} from '../hooks/use-workspaces';

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const workspace = useWorkspace(workspaceId);
  const updateWorkspace = useUpdateWorkspace();
  const pickFolder = usePickWorkspaceFolder(workspaceId);
  const updateFolder = useUpdateWorkspaceFolder();
  const removeFolder = useRemoveWorkspaceFolder();
  const [name, setName] = useState('');

  const workspaceName = workspace.data?.name ?? '';
  const effectiveName = name || workspaceName;
  const nameChanged = Boolean(workspace.data) && effectiveName.trim() !== workspaceName;

  const saveWorkspace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (workspaceId && effectiveName.trim()) {
      updateWorkspace.mutate(
        { id: workspaceId, name: effectiveName },
        { onSuccess: () => setName('') },
      );
    }
  };

  return (
    <section className="max-w-5xl">
      <Link
        to="/workspaces"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Workspaces
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            Workspace
          </p>
          <form onSubmit={saveWorkspace} className="mt-3 flex max-w-xl items-center gap-2">
            <input
              aria-label="Workspace name"
              value={effectiveName}
              onChange={(event) => setName(event.target.value)}
              disabled={!workspace.data}
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-0 py-1 text-3xl font-semibold text-white outline-none transition focus:border-zinc-700 focus:bg-zinc-950 focus:px-3 disabled:opacity-70"
            />
            {nameChanged && (
              <button
                type="submit"
                disabled={!effectiveName.trim() || updateWorkspace.isPending}
                aria-label="Save workspace name"
                title="Save workspace name"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
        <button
          type="button"
          onClick={() => pickFolder.mutate()}
          disabled={!workspaceId || pickFolder.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          <FolderOpen aria-hidden="true" className="h-4 w-4" />
          Add folder
        </button>
      </div>

      {workspace.isLoading && <p className="mt-6 text-sm text-zinc-400">Loading workspace</p>}
      {workspace.error && (
        <p className="mt-6 text-sm text-red-300">{formatRendererError(workspace.error)}</p>
      )}
      {updateWorkspace.error && (
        <p className="mt-4 text-sm text-red-300">{formatRendererError(updateWorkspace.error)}</p>
      )}
      {pickFolder.error && (
        <p className="mt-4 text-sm text-red-300">{formatRendererError(pickFolder.error)}</p>
      )}
      {(updateFolder.error || removeFolder.error) && (
        <p className="mt-4 text-sm text-red-300">
          {formatRendererError(updateFolder.error ?? removeFolder.error)}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {workspace.data?.folders.length === 0 && (
          <p className="rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
            No folders attached yet.
          </p>
        )}
        {workspace.data?.folders.map((folder) => (
          <WorkspaceFolderCard
            key={folder.id}
            folder={folder}
            isMutating={updateFolder.isPending || removeFolder.isPending}
            onRename={(label) => updateFolder.mutate({ id: folder.id, label })}
            onRemove={() => {
              if (window.confirm(`Remove ${folder.label} from this workspace?`)) {
                removeFolder.mutate({ id: folder.id });
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}

function WorkspaceFolderCard({
  folder,
  isMutating,
  onRemove,
  onRename,
}: {
  folder: WorkspaceFolderResult;
  isMutating: boolean;
  onRemove: () => void;
  onRename: (label: string) => void;
}) {
  const [label, setLabel] = useState(folder.label);
  const trimmed = label.trim();
  const changed = trimmed !== folder.label;

  return (
    <article className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-emerald-300">
          <FolderGit2 aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <input
            aria-label={`${folder.label} label`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-base font-medium text-zinc-100 outline-none focus:border-zinc-700 focus:bg-zinc-950 focus:px-2"
          />
          <p className="mt-1 truncate text-sm text-zinc-400">{folder.path}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {folder.currentBranch ? `Current branch ${folder.currentBranch}` : 'Detached HEAD'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/runs/new?workspaceId=${encodeURIComponent(folder.workspaceId)}&targetFolderId=${encodeURIComponent(folder.id)}`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
        >
          <Play aria-hidden="true" className="h-4 w-4 text-emerald-300" />
          New run
        </Link>
        <div className="flex gap-2">
          {changed && (
            <button
              type="button"
              onClick={() => onRename(trimmed)}
              disabled={!trimmed || isMutating}
              aria-label={`Save ${folder.label} label`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={isMutating}
            aria-label={`Remove ${folder.label}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
