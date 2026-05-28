import { Bot, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { formatRendererError } from '@/electron/renderer/shared/errors';
import { useAgentRuns } from '../hooks/use-agent-runs';

export function AgentRunsPage() {
  const runs = useAgentRuns();

  return (
    <section className="max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            Agent cockpit
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Runs</h2>
        </div>
        <Link
          to="/runs/new"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New run
        </Link>
      </div>

      <div className="mt-6 divide-y divide-zinc-800 rounded-md border border-zinc-800 bg-zinc-900">
        {runs.isLoading && <p className="p-4 text-sm text-zinc-400">Loading runs</p>}
        {runs.error && <p className="p-4 text-sm text-red-300">{formatRendererError(runs.error)}</p>}
        {runs.data?.length === 0 && (
          <p className="p-4 text-sm text-zinc-400">No agent runs yet.</p>
        )}
        {runs.data?.map((run) => (
          <Link
            key={run.id}
            to={`/runs/${run.id}`}
            className="grid grid-cols-[1fr_auto] gap-4 p-4 transition hover:bg-zinc-800/60"
          >
            <div>
              <div className="flex items-center gap-2">
                <Bot aria-hidden="true" className="h-4 w-4 text-emerald-300" />
                <h3 className="font-medium text-zinc-100">{run.workspaceName}</h3>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{run.prompt}</p>
              <p className="mt-2 text-xs text-zinc-500">{run.branchName}</p>
            </div>
            <div className="text-right text-sm">
              <p className={statusClassName(run.status)}>{run.status}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {new Date(run.createdAt).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function statusClassName(status: string): string {
  if (status === 'succeeded') {
    return 'text-emerald-300';
  }

  if (status === 'failed' || status === 'cancelled') {
    return 'text-red-300';
  }

  return 'text-amber-300';
}
