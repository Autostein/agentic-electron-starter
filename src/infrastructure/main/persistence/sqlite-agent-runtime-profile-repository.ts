import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
  AgentRuntimeProfileSourceKind,
  CreateAgentRuntimeProfile,
  UpdateAgentRuntimeProfile,
} from '@/core/agent-runtime/domain';
import { getMainDatabase } from './db/client';

export class SQLiteAgentRuntimeProfileRepository implements AgentRuntimeProfileRepository {
  async listProfiles(): Promise<AgentRuntimeProfile[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT
            id,
            name,
            source_kind AS sourceKind,
            profile_path AS profilePath,
            image_name AS imageName,
            claude_default_model AS claudeDefaultModel,
            codex_default_model AS codexDefaultModel,
            claude_auth_mount_enabled AS claudeAuthMountEnabled,
            codex_auth_mount_enabled AS codexAuthMountEnabled,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM agent_runtime_profiles
          ORDER BY created_at ASC, name ASC
        `,
      )
      .all() as AgentRuntimeProfileRow[];

    return rows.map(toProfile);
  }

  async getProfile(id: string): Promise<AgentRuntimeProfile | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT
            id,
            name,
            source_kind AS sourceKind,
            profile_path AS profilePath,
            image_name AS imageName,
            claude_default_model AS claudeDefaultModel,
            codex_default_model AS codexDefaultModel,
            claude_auth_mount_enabled AS claudeAuthMountEnabled,
            codex_auth_mount_enabled AS codexAuthMountEnabled,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM agent_runtime_profiles
          WHERE id = ?
        `,
      )
      .get(id) as AgentRuntimeProfileRow | undefined;

    return row ? toProfile(row) : null;
  }

  async createProfile(
    input: CreateAgentRuntimeProfile,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<AgentRuntimeProfile> {
    getMainDatabase()
      .prepare(
        `
          INSERT INTO agent_runtime_profiles (
            id,
            name,
            source_kind,
            profile_path,
            image_name,
            claude_default_model,
            codex_default_model,
            claude_auth_mount_enabled,
            codex_auth_mount_enabled,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        input.id,
        input.name,
        input.sourceKind,
        input.profilePath,
        input.imageName,
        input.claudeDefaultModel,
        input.codexDefaultModel,
        Number(input.claudeAuthMountEnabled),
        Number(input.codexAuthMountEnabled),
        timestamps.createdAt,
        timestamps.updatedAt,
      );

    const profile = await this.getProfile(input.id);

    if (!profile) {
      throw new Error('Failed to create runtime profile.');
    }

    return profile;
  }

  async updateProfile(
    id: string,
    input: UpdateAgentRuntimeProfile,
    updatedAt: number,
  ): Promise<AgentRuntimeProfile> {
    const current = await this.getProfile(id);

    if (!current) {
      throw new Error('Runtime profile not found.');
    }

    const next = { ...current, ...input, updatedAt };

    getMainDatabase()
      .prepare(
        `
          UPDATE agent_runtime_profiles
          SET
            name = ?,
            claude_default_model = ?,
            codex_default_model = ?,
            claude_auth_mount_enabled = ?,
            codex_auth_mount_enabled = ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        next.name,
        next.claudeDefaultModel,
        next.codexDefaultModel,
        Number(next.claudeAuthMountEnabled),
        Number(next.codexAuthMountEnabled),
        next.updatedAt,
        id,
      );

    return next;
  }
}

type AgentRuntimeProfileRow = {
  id: string;
  name: string;
  sourceKind: AgentRuntimeProfileSourceKind;
  profilePath: string | null;
  imageName: string;
  claudeDefaultModel: string;
  codexDefaultModel: string;
  claudeAuthMountEnabled: number;
  codexAuthMountEnabled: number;
  createdAt: number;
  updatedAt: number;
};

function toProfile(row: AgentRuntimeProfileRow): AgentRuntimeProfile {
  return {
    id: row.id,
    name: row.name,
    sourceKind: row.sourceKind,
    profilePath: row.profilePath,
    imageName: row.imageName,
    claudeDefaultModel: row.claudeDefaultModel,
    codexDefaultModel: row.codexDefaultModel,
    claudeAuthMountEnabled: Boolean(row.claudeAuthMountEnabled),
    codexAuthMountEnabled: Boolean(row.codexAuthMountEnabled),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
