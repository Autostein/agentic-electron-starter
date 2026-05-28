import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
} from '../../domain';

export type ListRuntimeProfilesDeps = {
  profileRepository: AgentRuntimeProfileRepository;
};

export function listRuntimeProfiles(
  deps: ListRuntimeProfilesDeps,
): Promise<AgentRuntimeProfile[]> {
  return deps.profileRepository.listProfiles();
}
