import type {
  AgentRuntimeSettings,
  AgentRuntimeSettingsRepository,
  UpdateAgentRuntimeSettings,
} from '../../../domain/agent-runtime';

export type UpdateRuntimeSettingsDeps = {
  settingsRepository: AgentRuntimeSettingsRepository;
  now: () => number;
};

export function updateRuntimeSettings(
  input: UpdateAgentRuntimeSettings,
  deps: UpdateRuntimeSettingsDeps,
): Promise<AgentRuntimeSettings> {
  return deps.settingsRepository.updateSettings(input, deps.now());
}
