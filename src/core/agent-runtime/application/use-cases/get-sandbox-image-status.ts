import type {
  DockerImageBuilder,
  DockerImageStatus,
} from '../../domain';

export type GetSandboxImageStatusDeps = {
  dockerImageBuilder: DockerImageBuilder;
  imageName: string;
  now: () => number;
};

export function getSandboxImageStatus(
  deps: GetSandboxImageStatusDeps,
): Promise<DockerImageStatus> {
  return deps.dockerImageBuilder.getImageStatus(
    { imageName: deps.imageName },
    deps.now(),
  );
}
