import { FolderOpen } from 'lucide-react';
import { usePickProject, useProjects } from '../hooks/use-projects';

export function ProjectsPage() {
  const projects = useProjects();
  const pickProject = usePickProject();

  return (
    <section className="max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            Repositories
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Projects</h2>
        </div>
        <button
          type="button"
          onClick={() => pickProject.mutate()}
          disabled={pickProject.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          <FolderOpen aria-hidden="true" className="h-4 w-4" />
          Pick repo
        </button>
      </div>

      <div className="mt-6 divide-y divide-zinc-800 rounded-md border border-zinc-800 bg-zinc-900">
        {projects.isLoading && <p className="p-4 text-sm text-zinc-400">Loading projects</p>}
        {projects.error && <p className="p-4 text-sm text-red-300">{projects.error.message}</p>}
        {projects.data?.length === 0 && (
          <p className="p-4 text-sm text-zinc-400">No projects added yet.</p>
        )}
        {projects.data?.map((project) => (
          <article key={project.id} className="p-4">
            <h3 className="font-medium text-zinc-100">{project.name}</h3>
            <p className="mt-1 truncate text-sm text-zinc-400">{project.path}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {project.currentBranch ? `Current branch ${project.currentBranch}` : 'Detached HEAD'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
