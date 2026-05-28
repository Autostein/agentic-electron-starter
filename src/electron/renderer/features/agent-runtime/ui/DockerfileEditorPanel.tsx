import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StreamLanguage } from '@codemirror/language';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import { Copy, ExternalLink, RotateCcw, Save } from 'lucide-react';
import { useBlocker } from 'react-router';
import type {
  AgentRuntimeProfileResult,
  RuntimeProfileDockerfileResult,
} from '@/contracts/ipc/agent-runtime.contract';
import {
  useAgentRuntimeProfileDockerfile,
  useOpenAgentRuntimeProfileFolder,
  useResetAgentRuntimeProfileDockerfile,
  useUpdateAgentRuntimeProfileDockerfile,
} from '../hooks/use-agent-runtime';

const dockerfileExtensions = [StreamLanguage.define(dockerFile)];

type DockerfileEditorPanelProps = {
  profile: AgentRuntimeProfileResult;
  duplicateStarterPending: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onDuplicateStarter: () => void;
  saveBeforeBuildRef: RefObject<() => Promise<boolean>>;
};

export function DockerfileEditorPanel({
  profile,
  duplicateStarterPending,
  onDirtyChange,
  onDuplicateStarter,
  saveBeforeBuildRef,
}: DockerfileEditorPanelProps) {
  const dockerfile = useAgentRuntimeProfileDockerfile(profile.id);

  if (dockerfile.isLoading) {
    return (
      <section className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-sm text-zinc-400">Loading Dockerfile</p>
      </section>
    );
  }

  if (dockerfile.error) {
    return (
      <section className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-sm text-red-300">{dockerfile.error.message}</p>
      </section>
    );
  }

  if (!dockerfile.data) {
    return null;
  }

  return (
    <DockerfileEditor
      key={profile.id}
      profile={profile}
      dockerfile={dockerfile.data}
      duplicateStarterPending={duplicateStarterPending}
      onDirtyChange={onDirtyChange}
      onDuplicateStarter={onDuplicateStarter}
      saveBeforeBuildRef={saveBeforeBuildRef}
    />
  );
}

type DockerfileEditorProps = {
  profile: AgentRuntimeProfileResult;
  dockerfile: RuntimeProfileDockerfileResult;
  duplicateStarterPending: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onDuplicateStarter: () => void;
  saveBeforeBuildRef: RefObject<() => Promise<boolean>>;
};

function DockerfileEditor({
  profile,
  dockerfile,
  duplicateStarterPending,
  onDirtyChange,
  onDuplicateStarter,
  saveBeforeBuildRef,
}: DockerfileEditorProps) {
  const [draft, setDraft] = useState(dockerfile.content);
  const [savedContent, setSavedContent] = useState(dockerfile.content);
  const updateDockerfile = useUpdateAgentRuntimeProfileDockerfile();
  const resetDockerfile = useResetAgentRuntimeProfileDockerfile();
  const openFolder = useOpenAgentRuntimeProfileFolder();
  const dirty = draft !== savedContent;
  const blocker = useBlocker(dirty);

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    if (window.confirm('Discard unsaved Dockerfile changes?')) {
      blocker.proceed();
      return;
    }

    blocker.reset();
  }, [blocker]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!dockerfile.editable || !dirty) {
      return true;
    }

    try {
      const result = await updateDockerfile.mutateAsync({
        profileId: profile.id,
        content: draft,
      });
      setDraft(result.content);
      setSavedContent(result.content);
      onDirtyChange(false);
      return true;
    } catch {
      return false;
    }
  }, [dirty, dockerfile.editable, draft, onDirtyChange, profile.id, updateDockerfile]);

  useEffect(() => {
    saveBeforeBuildRef.current = saveDraft;

    return () => {
      saveBeforeBuildRef.current = async () => true;
    };
  }, [saveBeforeBuildRef, saveDraft]);

  const changeDraft = (nextDraft: string) => {
    setDraft(nextDraft);
    onDirtyChange(nextDraft !== savedContent);
  };

  const resetFromStarter = async () => {
    try {
      const result = await resetDockerfile.mutateAsync({ profileId: profile.id });
      setDraft(result.content);
      setSavedContent(result.content);
      onDirtyChange(false);
    } catch {
      // Mutation state renders the error below the editor.
    }
  };

  const actionError = updateDockerfile.error ?? resetDockerfile.error ?? openFolder.error;

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-100">Dockerfile</h3>
            {dirty && <span className="text-xs text-amber-200">Unsaved</span>}
          </div>
          <p className="mt-1 break-all text-xs text-zinc-500">
            {dockerfile.path}
          </p>
        </div>

        {dockerfile.editable ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={!dirty || updateDockerfile.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => void resetFromStarter()}
              disabled={resetDockerfile.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => openFolder.mutate({ profileId: profile.id })}
              disabled={openFolder.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Open folder
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDuplicateStarter}
            disabled={duplicateStarterPending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            Duplicate starter to edit
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-zinc-800">
        <CodeMirror
          aria-label="Dockerfile editor"
          value={draft}
          height="420px"
          theme={oneDark}
          extensions={dockerfileExtensions}
          basicSetup={{
            foldGutter: true,
            highlightActiveLine: true,
            lineNumbers: true,
          }}
          editable={dockerfile.editable}
          readOnly={!dockerfile.editable}
          onChange={changeDraft}
        />
      </div>

      {actionError && <p className="mt-3 text-sm text-red-300">{actionError.message}</p>}
    </section>
  );
}
