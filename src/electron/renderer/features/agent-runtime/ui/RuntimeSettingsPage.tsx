import type { FormEvent } from 'react';
import { useState } from 'react';
import { Save } from 'lucide-react';
import type { AgentRuntimeSettingsResult } from '@/contracts/ipc/agent-runtime.contract';
import {
  useAgentRuntimeImageStatus,
  useAgentRuntimeSettings,
  useBuildAgentRuntimeImage,
  useUpdateAgentRuntimeSettings,
} from '../hooks/use-agent-runtime';
import { SandboxImagePanel } from './SandboxImagePanel';

export function RuntimeSettingsPage() {
  const settings = useAgentRuntimeSettings();

  if (settings.isLoading) {
    return <p className="text-sm text-zinc-400">Loading settings</p>;
  }

  if (settings.error) {
    return <p className="text-sm text-red-300">{settings.error.message}</p>;
  }

  if (!settings.data) {
    return <p className="text-sm text-zinc-400">Settings unavailable.</p>;
  }

  return <RuntimeSettingsForm key={settings.data.updatedAt} settings={settings.data} />;
}

function RuntimeSettingsForm({ settings }: { settings: AgentRuntimeSettingsResult }) {
  const updateSettings = useUpdateAgentRuntimeSettings();
  const buildImage = useBuildAgentRuntimeImage();
  const imageStatus = useAgentRuntimeImageStatus();
  const [form, setForm] = useState(settings);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings.mutate(form);
  };

  return (
    <section className="max-w-5xl">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
        Runtime
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Agent settings</h2>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <TextField
          label="Docker image"
          value={form.dockerImageName}
          onChange={(dockerImageName) => setForm((current) => ({ ...current, dockerImageName }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Claude model"
            value={form.claudeDefaultModel}
            onChange={(claudeDefaultModel) => setForm((current) => ({ ...current, claudeDefaultModel }))}
          />
          <TextField
            label="Codex model"
            value={form.codexDefaultModel}
            onChange={(codexDefaultModel) => setForm((current) => ({ ...current, codexDefaultModel }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="Claude auth path"
            enabled={form.claudeAuthMountEnabled}
            value={form.claudeAuthHostPath}
            onEnabledChange={(claudeAuthMountEnabled) => setForm((current) => ({ ...current, claudeAuthMountEnabled }))}
            onValueChange={(claudeAuthHostPath) => setForm((current) => ({ ...current, claudeAuthHostPath }))}
          />
          <AuthField
            label="Codex auth path"
            enabled={form.codexAuthMountEnabled}
            value={form.codexAuthHostPath}
            onEnabledChange={(codexAuthMountEnabled) => setForm((current) => ({ ...current, codexAuthMountEnabled }))}
            onValueChange={(codexAuthHostPath) => setForm((current) => ({ ...current, codexAuthHostPath }))}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>

      <div className="mt-6">
        <SandboxImagePanel status={imageStatus} buildImage={buildImage} />
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
      />
    </label>
  );
}

function AuthField({
  label,
  enabled,
  value,
  onEnabledChange,
  onValueChange,
}: {
  label: string;
  enabled: boolean;
  value: string;
  onEnabledChange: (value: boolean) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
      />
    </div>
  );
}
