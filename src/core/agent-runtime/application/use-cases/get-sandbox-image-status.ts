import type {
  AgentRuntimeProfile,
  DockerImageBuilder,
  DockerImageStatus,
} from '../../domain';

export type GetSandboxImageStatusDeps = {
  dockerImageBuilder: DockerImageBuilder;
  profile: AgentRuntimeProfile;
  now: () => number;
};

export function getSandboxImageStatus(
  deps: GetSandboxImageStatusDeps,
): Promise<DockerImageStatus> {
  return deps.dockerImageBuilder.getImageStatus(
    {
      imageName: deps.profile.imageName,
      sourceKind: deps.profile.sourceKind,
      profilePath: deps.profile.profilePath,
    },
    deps.now(),
  );
}
