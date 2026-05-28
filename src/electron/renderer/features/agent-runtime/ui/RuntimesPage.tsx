import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { Copy, Save } from 'lucide-react';
import type { AgentRuntimeProfileResult } from '@/contracts/ipc/agent-runtime.contract';
import {
  useAgentRuntimeImageStatus,
  useAgentRuntimeProfiles,
  useBuildAgentRuntimeImage,
  useDuplicateStarterRuntimeProfile,
  useUpdateAgentRuntimeProfile,
} from '../hooks/use-agent-runtime';
import { DockerfileEditorPanel } from './DockerfileEditorPanel';
import { SandboxImagePanel } from './SandboxImagePanel';

export function RuntimesPage() {
  const profiles = useAgentRuntimeProfiles();
  const duplicateProfile = useDuplicateStarterRuntimeProfile();
  const [selectedProfileId, setSelectedProfileId] = useState<string>();
  const [hasDockerfileChanges, setHasDockerfileChanges] = useState(false);
  const effectiveSelectedProfileId = selectedProfileId ?? profiles.data?.[0]?.id;
  const selectedProfile = profiles.data?.find((profile) => profile.id === effectiveSelectedProfileId);

  const selectProfile = (profileId: string) => {
    if (profileId === selectedProfile?.id) {
      return;
    }

    if (hasDockerfileChanges && !window.confirm('Discard unsaved Dockerfile changes?')) {
      return;
    }

    setHasDockerfileChanges(false);
    setSelectedProfileId(profileId);
  };

  const duplicateStarter = () => {
    if (hasDockerfileChanges && !window.confirm('Discard unsaved Dockerfile changes?')) {
      return;
    }

    duplicateProfile.mutate(undefined, {
      onSuccess: (profile) => {
        setHasDockerfileChanges(false);
        setSelectedProfileId(profile.id);
      },
    });
  };

  if (profiles.isLoading) {
    return <p className="text-sm text-zinc-400">Loading runtimes</p>;
  }

  if (profiles.error) {
    return <p className="text-sm text-red-300">{profiles.error.message}</p>;
  }

  return (
    <section className="max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
            Runtime
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Runtimes</h2>
        </div>
        <button
          type="button"
          onClick={duplicateStarter}
          disabled={duplicateProfile.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          <Copy aria-hidden="true" className="h-4 w-4" />
          Duplicate starter
        </button>
      </div>

      <div className="mt-6 grid grid-cols-[260px_1fr] gap-6">
        <div className="divide-y divide-zinc-800 rounded-md border border-zinc-800 bg-zinc-900">
          {profiles.data?.length === 0 && (
            <p className="p-4 text-sm text-zinc-400">No runtime profiles.</p>
          )}
          {profiles.data?.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => selectProfile(profile.id)}
              className={`block w-full p-4 text-left transition ${
                profile.id === selectedProfile?.id ? 'bg-emerald-950/40' : 'hover:bg-zinc-800/70'
              }`}
            >
              <p className="font-medium text-zinc-100">{profile.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{toSourceLabel(profile)}</p>
            </button>
          ))}
        </div>

        {selectedProfile ? (
          <RuntimeProfileForm
            key={selectedProfile.id}
            profile={selectedProfile}
            duplicateStarterPending={duplicateProfile.isPending}
            onDirtyChange={setHasDockerfileChanges}
            onDuplicateStarter={duplicateStarter}
          />
        ) : (
          <p className="text-sm text-zinc-400">Select a runtime profile.</p>
        )}
      </div>
    </section>
  );
}

function RuntimeProfileForm({
  profile,
  duplicateStarterPending,
  onDirtyChange,
  onDuplicateStarter,
}: {
  profile: AgentRuntimeProfileResult;
  duplicateStarterPending: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onDuplicateStarter: () => void;
}) {
  const updateProfile = useUpdateAgentRuntimeProfile();
  const imageStatus = useAgentRuntimeImageStatus(profile.id);
  const buildImage = useBuildAgentRuntimeImage(profile.id);
  const [dockerfileDirty, setDockerfileDirty] = useState(false);
  const saveBeforeBuildRef = useRef<() => Promise<boolean>>(async () => true);
  const [form, setForm] = useState({
    name: profile.name,
    claudeDefaultModel: profile.claudeDefaultModel,
    codexDefaultModel: profile.codexDefaultModel,
    claudeAuthMountEnabled: profile.claudeAuthMountEnabled,
    codexAuthMountEnabled: profile.codexAuthMountEnabled,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({ id: profile.id, ...form });
  };

  const handleDockerfileDirtyChange = (dirty: boolean) => {
    setDockerfileDirty(dirty);
    onDirtyChange(dirty);
  };

  return (
    <div className="min-w-0">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Name"
              value={form.name}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
            />
            <ReadOnlyField label="Image" value={profile.imageName} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ReadOnlyField label="Source" value={toSourceLabel(profile)} />
            <ReadOnlyField label="Profile folder" value={profile.profilePath ?? 'Bundled starter'} />
          </div>
        </div>

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
          <AuthToggle
            label="Mount Claude CLI auth (~/.claude)"
            enabled={form.claudeAuthMountEnabled}
            onChange={(claudeAuthMountEnabled) => setForm((current) => ({ ...current, claudeAuthMountEnabled }))}
          />
          <AuthToggle
            label="Mount Codex CLI auth (~/.codex)"
            enabled={form.codexAuthMountEnabled}
            onChange={(codexAuthMountEnabled) => setForm((current) => ({ ...current, codexAuthMountEnabled }))}
          />
        </div>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          Save
        </button>
        {updateProfile.error && <p className="text-sm text-red-300">{updateProfile.error.message}</p>}
      </form>

      <div className="mt-6">
        <DockerfileEditorPanel
          profile={profile}
          duplicateStarterPending={duplicateStarterPending}
          onDirtyChange={handleDockerfileDirtyChange}
          onDuplicateStarter={onDuplicateStarter}
          saveBeforeBuildRef={saveBeforeBuildRef}
        />
      </div>

      <div className="mt-6">
        <SandboxImagePanel
          status={imageStatus}
          buildImage={buildImage}
          dockerfileDirty={dockerfileDirty}
          onBeforeBuild={() => saveBeforeBuildRef.current()}
        />
      </div>
    </div>
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="mt-2 break-all rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
        {value}
      </p>
    </div>
  );
}

function AuthToggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm font-medium text-zinc-200">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function toSourceLabel(profile: AgentRuntimeProfileResult): string {
  return profile.sourceKind === 'bundled-starter' ? 'Bundled starter' : 'User-managed copy';
}
