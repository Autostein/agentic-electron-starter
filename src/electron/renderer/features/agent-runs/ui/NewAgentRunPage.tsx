import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { AgentProviderResult } from '@/contracts/ipc/agent-runs.contract';
import {
  useAgentRuntimeImageStatus,
  useAgentRuntimeProfiles,
  useBuildAgentRuntimeImage,
} from '../../agent-runtime/hooks/use-agent-runtime';
import { SandboxImagePanel } from '../../agent-runtime/ui/SandboxImagePanel';
import { usePickWorkspace, useWorkspaces } from '../../workspaces/hooks/use-workspaces';
import { useStartAgentRun } from '../hooks/use-agent-runs';

export function NewAgentRunPage() {
  const navigate = useNavigate();
  const workspaces = useWorkspaces();
  const pickWorkspace = usePickWorkspace();
  const profiles = useAgentRuntimeProfiles();
  const startRun = useStartAgentRun();
  const [workspaceId, setWorkspaceId] = useState('');
  const [runtimeProfileId, setRuntimeProfileId] = useState('');
  const [provider, setProvider] = useState<AgentProviderResult>('claude-code');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(1);
  const selectedProfile = profiles.data?.find((profile) => profile.id === runtimeProfileId)
    ?? profiles.data?.[0];
  const effectiveRuntimeProfileId = runtimeProfileId || selectedProfile?.id || '';
  const imageStatus = useAgentRuntimeImageStatus(effectiveRuntimeProfileId);
  const buildImage = useBuildAgentRuntimeImage(effectiveRuntimeProfileId);

  const defaultModel = useMemo(() => {
    if (!selectedProfile) {
      return '';
    }

    return provider === 'claude-code'
      ? selectedProfile.claudeDefaultModel
      : selectedProfile.codexDefaultModel;
  }, [provider, selectedProfile]);

  useEffect(() => {
    setModel(defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    if (!workspaceId && workspaces.data?.[0]) {
      setWorkspaceId(workspaces.data[0].id);
    }
  }, [workspaceId, workspaces.data]);

  useEffect(() => {
    if (!runtimeProfileId && profiles.data?.[0]) {
      setRuntimeProfileId(profiles.data[0].id);
    }
  }, [profiles.data, runtimeProfileId]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (imageStatus.data?.available !== true) {
      return;
    }

    startRun.mutate(
      { workspaceId, runtimeProfileId: effectiveRuntimeProfileId, provider, model, prompt, maxIterations },
      {
        onSuccess: (run) => {
          navigate(`/runs/${run.id}`);
        },
      },
    );
  };
  const canStartRun = Boolean(
    workspaceId
      && effectiveRuntimeProfileId
      && model.trim()
      && prompt.trim()
      && imageStatus.data?.available
      && !imageStatus.isLoading
      && !buildImage.mutation.isPending
      && !startRun.isPending,
  );

  return (
    <section className="max-w-4xl">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
        Start task
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">New agent run</h2>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-200">Workspace</span>
          <div className="mt-2 flex gap-2">
            <select
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            >
              {workspaces.data?.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => pickWorkspace.mutate()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
            >
              <FolderOpen aria-hidden="true" className="h-4 w-4" />
              Add
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-200">Runtime</span>
          <select
            value={effectiveRuntimeProfileId}
            onChange={(event) => setRuntimeProfileId(event.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
          >
            {profiles.data?.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-[1fr_1fr_120px] gap-3">
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Provider</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as AgentProviderResult)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            >
              <option value="claude-code">Claude Code</option>
              <option value="codex">Codex</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Model</span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Iterations</span>
            <input
              type="number"
              min={1}
              max={20}
              value={maxIterations}
              onChange={(event) => setMaxIterations(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-zinc-200">Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="mt-2 min-h-52 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            placeholder="Implement the change and commit it when complete."
          />
        </label>

        <SandboxImagePanel status={imageStatus} buildImage={buildImage} />

        <button
          type="submit"
          disabled={!canStartRun}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play aria-hidden="true" className="h-4 w-4" />
          Start run
        </button>
        {startRun.error && <p className="text-sm text-red-300">{startRun.error.message}</p>}
      </form>
    </section>
  );
}
