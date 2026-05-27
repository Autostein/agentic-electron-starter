import type {
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
} from '../../domain';

export type BuildSandboxImageDeps = {
  dockerImageBuilder: DockerImageBuilder;
  imageName: string;
  onEvent: (event: DockerImageBuildEvent) => void;
};

export function buildSandboxImage(
  deps: BuildSandboxImageDeps,
): Promise<DockerImageBuildResult> {
  return deps.dockerImageBuilder.buildImage(
    { imageName: deps.imageName },
    deps.onEvent,
  );
}
