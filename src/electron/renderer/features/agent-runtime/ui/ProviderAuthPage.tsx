import { AlertTriangle, CheckCircle2, CircleHelp, RefreshCw, XCircle } from 'lucide-react';
import type {
  AgentProviderAuthStateResult,
  AgentProviderAuthStatusResult,
} from '@/contracts/ipc/agent-runtime.contract';
import { formatRendererError } from '@/electron/renderer/shared/errors';
import { useAgentProviderAuthStatuses } from '../hooks/use-agent-runtime';

export function ProviderAuthPage() {
  const authStatuses = useAgentProviderAuthStatuses();

  if (authStatuses.isLoading) {
    return <p className="text-sm text-zinc-400">Loading provider auth</p>;
  }

  if (authStatuses.error) {
    return <p className="text-sm text-red-300">{formatRendererError(authStatuses.error)}</p>;
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            LLM auth
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Providers</h2>
        </div>
        <button
          type="button"
          onClick={() => void authStatuses.refetch()}
          disabled={authStatuses.isFetching}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {authStatuses.data?.map((status) => (
          <article
            key={`${status.provider}-${status.state}`}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-zinc-100">{status.label}</h3>
                <p className="mt-1 break-all text-xs text-zinc-500">{status.cliAuthPath}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  CLI {status.cliVersion ?? 'not installed'}
                </p>
              </div>
              <StatusBadge state={status.state} />
            </div>
            <p className={status.connected ? 'mt-4 text-sm text-zinc-400' : 'mt-4 text-sm text-amber-200'}>
              {status.message}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Last checked {formatCheckedAt(status)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ state }: { state: AgentProviderAuthStateResult }) {
  const display = toStateDisplay(state);
  const Icon = display.icon;

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium',
        display.className,
      ].join(' ')}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {display.label}
    </span>
  );
}

function toStateDisplay(state: AgentProviderAuthStateResult) {
  if (state === 'valid') {
    return {
      label: 'Connected',
      icon: CheckCircle2,
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    };
  }

  if (state === 'missing') {
    return {
      label: 'Missing',
      icon: XCircle,
      className: 'border-zinc-600 bg-zinc-800 text-zinc-200',
    };
  }

  if (state === 'invalid') {
    return {
      label: 'Invalid',
      icon: AlertTriangle,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    };
  }

  return {
    label: 'Unknown',
    icon: CircleHelp,
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  };
}

function formatCheckedAt(status: AgentProviderAuthStatusResult): string {
  return new Date(status.checkedAt).toLocaleString();
}
