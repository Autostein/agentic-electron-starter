import type {
  DuplicateStarterRuntimeProfileInput,
  GetAgentRuntimeProfileInput,
  RuntimeProfileDockerfileInput,
  RuntimeProfileImageInput,
  UpdateAgentRuntimeProfileInput,
  UpdateRuntimeProfileDockerfileInput,
} from '@/contracts/ipc/agent-runtime.contract';

export function listAgentRuntimeProfiles() {
  return window.desktop.agentRuntime.listProfiles();
}

export function getAgentRuntimeProfile(input: GetAgentRuntimeProfileInput) {
  return window.desktop.agentRuntime.getProfile(input);
}

export function updateAgentRuntimeProfile(input: UpdateAgentRuntimeProfileInput) {
  return window.desktop.agentRuntime.updateProfile(input);
}

export function duplicateStarterRuntimeProfile(input?: DuplicateStarterRuntimeProfileInput) {
  return window.desktop.agentRuntime.duplicateStarterProfile(input);
}

export function getAgentRuntimeProfileDockerfile(input: RuntimeProfileDockerfileInput) {
  return window.desktop.agentRuntime.getProfileDockerfile(input);
}

export function updateAgentRuntimeProfileDockerfile(input: UpdateRuntimeProfileDockerfileInput) {
  return window.desktop.agentRuntime.updateProfileDockerfile(input);
}

export function resetAgentRuntimeProfileDockerfile(input: RuntimeProfileDockerfileInput) {
  return window.desktop.agentRuntime.resetProfileDockerfile(input);
}

export function openAgentRuntimeProfileFolder(input: RuntimeProfileDockerfileInput) {
  return window.desktop.agentRuntime.openProfileFolder(input);
}

export function getAgentRuntimeImageStatus(input: RuntimeProfileImageInput) {
  return window.desktop.agentRuntime.getImageStatus(input);
}

export function buildAgentRuntimeImage(input: RuntimeProfileImageInput) {
  return window.desktop.agentRuntime.buildImage(input);
}

export function onAgentRuntimeBuildEvent(
  callback: Parameters<typeof window.desktop.agentRuntime.onBuildEvent>[0],
) {
  return window.desktop.agentRuntime.onBuildEvent(callback);
}
