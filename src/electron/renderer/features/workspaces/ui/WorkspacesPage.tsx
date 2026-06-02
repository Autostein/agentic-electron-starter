import type { FormEvent } from 'react';
import { useState } from 'react';
import { FolderGit2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { formatRendererError } from '@/electron/renderer/shared/errors';
import { useCreateWorkspace, useWorkspaces } from '../hooks/use-workspaces';

export function WorkspacesPage() {
  const navigate = useNavigate();
  const workspaces = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [name, setName] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createWorkspace.mutate(
      { name },
      {
        onSuccess: (workspace) => {
          setName('');
          navigate(`/workspaces/${workspace.id}`);
        },
      },
    );
  };

  return (
    <section className="max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            Workspace groups
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Workspaces</h2>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Workspace name"
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={!name.trim() || createWorkspace.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Create
        </button>
      </form>
      {createWorkspace.error && (
        <p className="mt-3 text-sm text-red-300">{formatRendererError(createWorkspace.error)}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-800 rounded-md border border-zinc-800 bg-zinc-900">
        {workspaces.isLoading && <p className="p-4 text-sm text-zinc-400">Loading workspaces</p>}
        {workspaces.error && (
          <p className="p-4 text-sm text-red-300">{formatRendererError(workspaces.error)}</p>
        )}
        {workspaces.data?.length === 0 && (
          <p className="p-4 text-sm text-zinc-400">No workspaces created yet.</p>
        )}
        {workspaces.data?.map((workspace) => (
          <Link
            key={workspace.id}
            to={`/workspaces/${workspace.id}`}
            className="grid grid-cols-[1fr_auto] gap-4 p-4 transition hover:bg-zinc-800/60"
          >
            <div className="flex items-center gap-3">
              <FolderGit2 aria-hidden="true" className="h-4 w-4 text-emerald-300" />
              <h3 className="font-medium text-zinc-100">{workspace.name}</h3>
            </div>
            <p className="text-sm text-zinc-400">
              {workspace.folderCount === 1 ? '1 folder' : `${workspace.folderCount} folders`}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
