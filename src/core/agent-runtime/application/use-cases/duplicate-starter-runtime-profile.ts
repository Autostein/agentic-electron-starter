import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
} from '../../domain';
import {
  STARTER_RUNTIME_PROFILE_ID,
  toRuntimeProfileImageName,
} from '../../domain';
import { AppError } from '@/shared/app-errors';

export type DuplicateStarterRuntimeProfileInput = {
  name?: string;
};

export type DuplicateStarterRuntimeProfileDeps = {
  profileRepository: AgentRuntimeProfileRepository;
  copyStarterProfile: (profileId: string) => string;
  createId: () => string;
  now: () => number;
};

export async function duplicateStarterRuntimeProfile(
  input: DuplicateStarterRuntimeProfileInput,
  deps: DuplicateStarterRuntimeProfileDeps,
): Promise<AgentRuntimeProfile> {
  const starter = await deps.profileRepository.getProfile(STARTER_RUNTIME_PROFILE_ID);

  if (!starter) {
    throw new AppError('NOT_FOUND', 'Starter runtime profile not found.');
  }

  const id = deps.createId();
  const now = deps.now();
  const profilePath = deps.copyStarterProfile(id);

  return deps.profileRepository.createProfile(
    {
      id,
      name: input.name?.trim() || 'Starter copy',
      sourceKind: 'user-managed-copy',
      profilePath,
      imageName: toRuntimeProfileImageName(id),
      claudeDefaultModel: starter.claudeDefaultModel,
      codexDefaultModel: starter.codexDefaultModel,
      claudeAuthMountEnabled: false,
      codexAuthMountEnabled: false,
    },
    { createdAt: now, updatedAt: now },
  );
}
