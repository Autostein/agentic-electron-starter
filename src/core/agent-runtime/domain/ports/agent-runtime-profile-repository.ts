import type {
  AgentRuntimeProfile,
  CreateAgentRuntimeProfile,
  UpdateAgentRuntimeProfile,
} from '../entities/agent-runtime-profile';

export interface AgentRuntimeProfileRepository {
  listProfiles(): Promise<AgentRuntimeProfile[]>;
  getProfile(id: string): Promise<AgentRuntimeProfile | null>;
  createProfile(
    input: CreateAgentRuntimeProfile,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<AgentRuntimeProfile>;
  updateProfile(
    id: string,
    input: UpdateAgentRuntimeProfile,
    updatedAt: number,
  ): Promise<AgentRuntimeProfile>;
}
