import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { AgentProviderResult } from '@/contracts/ipc/agent-runs.contract';
import {
  useAgentRuntimeImageStatus,
  useAgentRuntimeSettings,
  useBuildAgentRuntimeImage,
} from '../../agent-runtime/hooks/use-agent-runtime';
import { SandboxImagePanel } from '../../agent-runtime/ui/SandboxImagePanel';
import { usePickProject, useProjects } from '../../projects/hooks/use-projects';
import { useStartAgentRun } from '../hooks/use-agent-runs';

export function NewAgentRunPage() {
  const navigate = useNavigate();
  const projects = useProjects();
  const pickProject = usePickProject();
  const settings = useAgentRuntimeSettings();
  const imageStatus = useAgentRuntimeImageStatus();
  const buildImage = useBuildAgentRuntimeImage();
  const startRun = useStartAgentRun();
  const [projectId, setProjectId] = useState('');
  const [provider, setProvider] = useState<AgentProviderResult>('claude-code');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(1);

  const defaultModel = useMemo(() => {
    if (!settings.data) {
      return '';
    }

    return provider === 'claude-code'
      ? settings.data.claudeDefaultModel
      : settings.data.codexDefaultModel;
  }, [provider, settings.data]);

  useEffect(() => {
    setModel(defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    if (!projectId && projects.data?.[0]) {
      setProjectId(projects.data[0].id);
    }
  }, [projectId, projects.data]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (imageStatus.data?.available !== true) {
      return;
    }

    startRun.mutate(
      { projectId, provider, model, prompt, maxIterations },
      {
        onSuccess: (run) => {
          navigate(`/runs/${run.id}`);
        },
      },
    );
  };
  const canStartRun = Boolean(
    projectId
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
          <span className="text-sm font-medium text-zinc-200">Project</span>
          <div className="mt-2 flex gap-2">
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            >
              {projects.data?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => pickProject.mutate()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
            >
              <FolderOpen aria-hidden="true" className="h-4 w-4" />
              Pick
            </button>
          </div>
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
