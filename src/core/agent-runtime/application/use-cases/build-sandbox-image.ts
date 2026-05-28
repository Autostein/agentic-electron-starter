import type {
  AgentRuntimeProfile,
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
} from '../../domain';

export type BuildSandboxImageDeps = {
  dockerImageBuilder: DockerImageBuilder;
  profile: AgentRuntimeProfile;
  onEvent: (event: DockerImageBuildEvent) => void;
};

export function buildSandboxImage(
  deps: BuildSandboxImageDeps,
): Promise<DockerImageBuildResult> {
  return deps.dockerImageBuilder.buildImage(
    {
      imageName: deps.profile.imageName,
      sourceKind: deps.profile.sourceKind,
      profilePath: deps.profile.profilePath,
    },
    deps.onEvent,
  );
}
