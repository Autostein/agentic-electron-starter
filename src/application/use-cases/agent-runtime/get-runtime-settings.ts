import type {
  AgentRuntimeSettings,
  AgentRuntimeSettingsRepository,
} from '../../../domain/agent-runtime';

export type GetRuntimeSettingsDeps = {
  settingsRepository: AgentRuntimeSettingsRepository;
};

export function getRuntimeSettings(
  deps: GetRuntimeSettingsDeps,
): Promise<AgentRuntimeSettings> {
  return deps.settingsRepository.getSettings();
}
