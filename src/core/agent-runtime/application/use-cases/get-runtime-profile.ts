import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
} from '../../domain';

export type GetRuntimeProfileDeps = {
  profileRepository: AgentRuntimeProfileRepository;
};

export function getRuntimeProfile(
  id: string,
  deps: GetRuntimeProfileDeps,
): Promise<AgentRuntimeProfile | null> {
  return deps.profileRepository.getProfile(id);
}
