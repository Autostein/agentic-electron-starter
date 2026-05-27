import type {
  DockerImageBuildEvent,
  DockerImageStatus,
} from '../entities/agent-runtime-settings';

export type BuildDockerImageInput = {
  imageName: string;
};

export type DockerImageBuildResult = {
  imageName: string;
  succeeded: boolean;
};

export interface DockerImageBuilder {
  getImageStatus(input: BuildDockerImageInput, checkedAt: number): Promise<DockerImageStatus>;
  buildImage(
    input: BuildDockerImageInput,
    onEvent: (event: DockerImageBuildEvent) => void,
  ): Promise<DockerImageBuildResult>;
}
