import type { UpdateAgentRuntimeSettingsInput } from '@/contracts/ipc/agent-runtime.contract';

export function getAgentRuntimeSettings() {
  return window.desktop.agentRuntime.getSettings();
}

export function updateAgentRuntimeSettings(input: UpdateAgentRuntimeSettingsInput) {
  return window.desktop.agentRuntime.updateSettings(input);
}

export function getAgentRuntimeImageStatus() {
  return window.desktop.agentRuntime.getImageStatus();
}

export function buildAgentRuntimeImage() {
  return window.desktop.agentRuntime.buildImage();
}

export function onAgentRuntimeBuildEvent(
  callback: Parameters<typeof window.desktop.agentRuntime.onBuildEvent>[0],
) {
  return window.desktop.agentRuntime.onBuildEvent(callback);
}
