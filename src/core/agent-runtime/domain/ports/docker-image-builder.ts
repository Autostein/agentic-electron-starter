import type {
  AgentRuntimeProfileSourceKind,
  DockerImageBuildEvent,
  DockerImageStatus,
} from '../entities/agent-runtime-profile';

export type BuildDockerImageInput = {
  imageName: string;
  sourceKind: AgentRuntimeProfileSourceKind;
  profilePath: string | null;
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
