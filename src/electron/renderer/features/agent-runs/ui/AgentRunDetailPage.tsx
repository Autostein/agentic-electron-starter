import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, GitBranch, Square } from 'lucide-react';
import { useParams } from 'react-router';
import type {
  AgentRunCommitFileDiff,
  AgentRunCommitResult,
  AgentRunDiffLineResult,
} from '@/contracts/ipc/agent-runs.contract';
import { formatRendererError } from '@/electron/renderer/shared/errors';
import {
  useAgentRun,
  useAgentRunCommitDetails,
  useAgentRunCommitFileDiff,
  useAgentRunEventSubscription,
  useCancelAgentRun,
} from '../hooks/use-agent-runs';

export function AgentRunDetailPage() {
  const { runId } = useParams();
  const detail = useAgentRun(runId);
  const cancelRun = useCancelAgentRun();
  useAgentRunEventSubscription(runId);
  const commitSummaries = detail.data?.commits;
  const firstAvailableSha = useMemo(
    () => commitSummaries?.find((commit) => !commit.unavailable)?.sha,
    [commitSummaries],
  );
  const [selectedSha, setSelectedSha] = useState<string>();
  const effectiveSelectedSha = selectedSha ?? firstAvailableSha;

  if (detail.isLoading) {
    return <p className="text-sm text-zinc-400">Loading run</p>;
  }

  if (detail.error) {
    return <p className="text-sm text-red-300">{formatRendererError(detail.error)}</p>;
  }

  if (!detail.data) {
    return <p className="text-sm text-zinc-400">Run not found.</p>;
  }

  const { run, events, commits } = detail.data;
  const canCancel = run.status === 'queued' || run.status === 'running';

  return (
    <section className="max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            {run.provider}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{run.workspaceName}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <GitBranch aria-hidden="true" className="h-4 w-4" />
            {run.branchName}
          </p>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={() => cancelRun.mutate({ id: run.id })}
            className="inline-flex items-center gap-2 rounded-md border border-red-500/60 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
          >
            <Square aria-hidden="true" className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0 space-y-6">
          <CommitDiffPanel
            runId={run.id}
            commits={commits}
            selectedSha={effectiveSelectedSha}
            onSelectSha={setSelectedSha}
          />
          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="font-medium text-zinc-100">Log</h3>
            </div>
            <div className="max-h-[360px] space-y-2 overflow-auto p-4 font-mono text-xs leading-5 text-zinc-300">
              {events.length === 0 && <p className="text-zinc-500">No events yet.</p>}
              {events.map((event) => (
                <p key={event.id} className={event.type === 'error' ? 'text-red-300' : ''}>
                  <span className="text-zinc-600">
                    {new Date(event.createdAt).toLocaleTimeString()} [{event.type}]
                  </span>{' '}
                  {event.message}
                </p>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Status</p>
            <p className="mt-2 font-medium text-zinc-100">{run.status}</p>
            {run.errorMessage && <p className="mt-3 text-sm text-red-300">{run.errorMessage}</p>}
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Commits</p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              {commits.length === 0 && <p className="text-zinc-500">No commits yet.</p>}
              {commits.map((commit) => (
                <CommitSidebarItem
                  key={commit.sha}
                  commit={commit}
                  selected={commit.sha === effectiveSelectedSha}
                  onSelect={() => setSelectedSha(commit.sha)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CommitSidebarItem({
  commit,
  selected,
  onSelect,
}: {
  commit: AgentRunCommitResult;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={commit.unavailable}
      className={`w-full rounded-md border p-3 text-left disabled:cursor-not-allowed disabled:opacity-70 ${
        selected ? 'border-emerald-500/70 bg-emerald-950/20' : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
      }`}
    >
      <p className="font-mono text-xs text-zinc-400">{commit.shortSha}</p>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-100">
        {commit.subject ?? 'Commit unavailable'}
      </p>
      {commit.unavailable ? (
        <p className="mt-2 text-xs text-amber-300">unavailable</p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          {commit.filesChanged} files{' '}
          <span className="text-emerald-300">+{commit.additions}</span>{' '}
          <span className="text-red-300">-{commit.deletions}</span>
        </p>
      )}
    </button>
  );
}

function CommitDiffPanel({
  runId,
  commits,
  selectedSha,
  onSelectSha,
}: {
  runId: string;
  commits: AgentRunCommitResult[];
  selectedSha: string | undefined;
  onSelectSha: (sha: string) => void;
}) {
  const detail = useAgentRunCommitDetails(runId, selectedSha);

  if (commits.length === 0) {
    return (
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-sm text-zinc-500">No commits to inspect yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h3 className="font-medium text-zinc-100">Diff</h3>
        <select
          value={selectedSha ?? ''}
          onChange={(event) => onSelectSha(event.target.value)}
          className="max-w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
        >
          {commits.map((commit) => (
            <option key={commit.sha} value={commit.sha} disabled={commit.unavailable}>
              {commit.shortSha} {commit.subject ?? 'unavailable'}
            </option>
          ))}
        </select>
      </div>

      {detail.isLoading && <p className="p-4 text-sm text-zinc-400">Loading commit diff</p>}
      {detail.error && <p className="p-4 text-sm text-red-300">{formatRendererError(detail.error)}</p>}
      {detail.data && (
        <div>
          <div className="border-b border-zinc-800 p-4">
            <p className="text-lg font-medium text-zinc-100">{detail.data.subject}</p>
            <p className="mt-2 text-sm text-zinc-400">
              {detail.data.shortSha} by {detail.data.authorName} &lt;{detail.data.authorEmail}&gt; on{' '}
              {new Date(detail.data.committedAt).toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {detail.data.filesChanged} files changed{' '}
              <span className="text-emerald-300">+{detail.data.additions}</span>{' '}
              <span className="text-red-300">-{detail.data.deletions}</span>
            </p>
          </div>
          <div className="space-y-4 p-4">
            {detail.data.files.map((file) => (
              <CommitFileDiffView
                key={`${file.oldPath ?? ''}:${file.newPath ?? ''}`}
                runId={runId}
                sha={detail.data.sha}
                file={file}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommitFileDiffView({
  runId,
  sha,
  file,
}: {
  runId: string;
  sha: string;
  file: AgentRunCommitFileDiff;
}) {
  const [expanded, setExpanded] = useState(!file.isLarge);
  const path = file.newPath ?? file.oldPath ?? '';
  const loadedFile = useAgentRunCommitFileDiff(
    file.isLarge && expanded ? { runId, sha, path } : undefined,
  );
  const visibleFile = loadedFile.data ?? file;
  const showLargePlaceholder = file.isLarge && !loadedFile.data;

  return (
    <div className="overflow-hidden rounded-md border border-zinc-800">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-zinc-100">{path}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {file.status} <span className="text-emerald-300">+{file.additions}</span>{' '}
            <span className="text-red-300">-{file.deletions}</span>
          </p>
        </div>
        {file.isLarge && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-800"
          >
            {expanded ? (
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            )}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {showLargePlaceholder && !expanded && (
        <div className="flex items-center gap-2 bg-zinc-950 p-4 text-sm text-zinc-400">
          <FileCode2 aria-hidden="true" className="h-4 w-4" />
          Large diff collapsed.
        </div>
      )}
      {showLargePlaceholder && expanded && loadedFile.isLoading && (
        <p className="bg-zinc-950 p-4 text-sm text-zinc-400">Loading file diff</p>
      )}
      {showLargePlaceholder && expanded && loadedFile.error && (
        <p className="bg-zinc-950 p-4 text-sm text-red-300">
          {formatRendererError(loadedFile.error)}
        </p>
      )}
      {(!showLargePlaceholder || loadedFile.data) && (
        <div className="overflow-x-auto bg-zinc-950 font-mono text-xs">
          {visibleFile.hunks.length === 0 && (
            <p className="p-4 text-zinc-500">No text diff available.</p>
          )}
          {visibleFile.hunks.map((hunk) => (
            <div key={hunk.header}>
              <div className="min-w-max bg-sky-950/40 px-3 py-1 text-sky-200">{hunk.header}</div>
              {hunk.lines.map((line, index) => (
                <DiffLine key={`${hunk.header}-${index}`} line={line} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffLine({ line }: { line: AgentRunDiffLineResult }) {
  const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
  const className = {
    addition: 'bg-emerald-950/40 text-emerald-100',
    deletion: 'bg-red-950/40 text-red-100',
    context: 'text-zinc-300',
  }[line.type];

  return (
    <div className={`grid min-w-max grid-cols-[56px_56px_24px_1fr] ${className}`}>
      <span className="select-none border-r border-zinc-900 px-2 py-0.5 text-right text-zinc-600">
        {line.oldLineNumber ?? ''}
      </span>
      <span className="select-none border-r border-zinc-900 px-2 py-0.5 text-right text-zinc-600">
        {line.newLineNumber ?? ''}
      </span>
      <span className="select-none px-2 py-0.5 text-zinc-500">{prefix}</span>
      <span className="whitespace-pre px-2 py-0.5">{line.content}</span>
    </div>
  );
}
