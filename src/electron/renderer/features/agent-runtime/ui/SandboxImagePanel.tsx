import { AlertTriangle, CheckCircle2, Hammer, RefreshCcw } from 'lucide-react';
import type {
  useAgentRuntimeImageStatus,
  useBuildAgentRuntimeImage,
} from '../hooks/use-agent-runtime';

type SandboxImagePanelProps = {
  status: ReturnType<typeof useAgentRuntimeImageStatus>;
  buildImage: ReturnType<typeof useBuildAgentRuntimeImage>;
};

export function SandboxImagePanel({ status, buildImage }: SandboxImagePanelProps) {
  const available = status.data?.available === true;
  const unavailable = status.data?.available === false || Boolean(status.error);
  const statusText = toStatusText(status);

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">Sandbox image</p>
          <p className="mt-1 break-all text-xs text-zinc-400">
            {status.data?.imageName ?? 'Checking Docker image'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void status.refetch()}
            disabled={status.isFetching}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCcw aria-hidden="true" className="h-4 w-4" />
            Check
          </button>
          <button
            type="button"
            onClick={() => buildImage.mutation.mutate()}
            disabled={buildImage.mutation.isPending}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
          >
            <Hammer aria-hidden="true" className="h-4 w-4" />
            Build image
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-sm">
        {available ? (
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 text-emerald-300" />
        ) : (
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 text-amber-300" />
        )}
        <p className={available ? 'text-emerald-200' : 'text-amber-200'}>{statusText}</p>
      </div>

      {(unavailable || buildImage.events.length > 0 || buildImage.mutation.error) && (
        <div className="mt-4 max-h-72 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
          {buildImage.events.length === 0 && !buildImage.mutation.error && (
            <p className="text-zinc-500">No build output.</p>
          )}
          {buildImage.events.map((event, index) => (
            <p key={`${event.createdAt}-${index}`} className={event.type === 'error' ? 'text-red-300' : ''}>
              {event.message}
            </p>
          ))}
          {buildImage.mutation.error && (
            <p className="text-red-300">{buildImage.mutation.error.message}</p>
          )}
        </div>
      )}
    </section>
  );
}

function toStatusText(status: ReturnType<typeof useAgentRuntimeImageStatus>): string {
  if (status.isLoading) {
    return 'Checking local Docker image.';
  }

  if (status.error) {
    return status.error.message;
  }

  if (!status.data) {
    return 'Image status unavailable.';
  }

  if (status.data.available) {
    return 'Image is available. Agent runs can start.';
  }

  return status.data.errorMessage ?? 'Image is not available. Build it before starting a run.';
}
