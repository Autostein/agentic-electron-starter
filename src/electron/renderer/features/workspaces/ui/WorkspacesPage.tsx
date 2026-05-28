import { FolderOpen } from 'lucide-react';
import { usePickWorkspace, useWorkspaces } from '../hooks/use-workspaces';

export function WorkspacesPage() {
  const workspaces = useWorkspaces();
  const pickWorkspace = usePickWorkspace();

  return (
    <section className="max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            Git workspaces
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Workspaces</h2>
        </div>
        <button
          type="button"
          onClick={() => pickWorkspace.mutate()}
          disabled={pickWorkspace.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          <FolderOpen aria-hidden="true" className="h-4 w-4" />
          Add workspace
        </button>
      </div>

      <div className="mt-6 divide-y divide-zinc-800 rounded-md border border-zinc-800 bg-zinc-900">
        {workspaces.isLoading && <p className="p-4 text-sm text-zinc-400">Loading workspaces</p>}
        {workspaces.error && <p className="p-4 text-sm text-red-300">{workspaces.error.message}</p>}
        {workspaces.data?.length === 0 && (
          <p className="p-4 text-sm text-zinc-400">
            No git-backed workspaces added yet.
          </p>
        )}
        {workspaces.data?.map((workspace) => (
          <article key={workspace.id} className="p-4">
            <h3 className="font-medium text-zinc-100">{workspace.name}</h3>
            <p className="mt-1 truncate text-sm text-zinc-400">{workspace.path}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {workspace.currentBranch ? `Current branch ${workspace.currentBranch}` : 'Detached HEAD'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
