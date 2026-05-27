import type {
  AgentRuntimeSettings,
  UpdateAgentRuntimeSettings,
} from '../entities/agent-runtime-settings';

export interface AgentRuntimeSettingsRepository {
  getSettings(): Promise<AgentRuntimeSettings>;
  updateSettings(input: UpdateAgentRuntimeSettings, updatedAt: number): Promise<AgentRuntimeSettings>;
}
