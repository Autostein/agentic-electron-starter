import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
  UpdateAgentRuntimeProfile,
} from '../../domain';

export type UpdateRuntimeProfileDeps = {
  profileRepository: AgentRuntimeProfileRepository;
  now: () => number;
};

export function updateRuntimeProfile(
  id: string,
  input: UpdateAgentRuntimeProfile,
  deps: UpdateRuntimeProfileDeps,
): Promise<AgentRuntimeProfile> {
  return deps.profileRepository.updateProfile(id, input, deps.now());
}
