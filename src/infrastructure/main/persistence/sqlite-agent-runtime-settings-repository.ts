import os from 'node:os';
import path from 'node:path';
import type {
  AgentRuntimeSettings,
  AgentRuntimeSettingsRepository,
  UpdateAgentRuntimeSettings,
} from '../../../domain/agent-runtime';
import { getMainDatabase } from './db/client';

const SETTINGS_ID = 'default';
const DEFAULT_SETTINGS: Omit<AgentRuntimeSettings, 'updatedAt'> = {
  dockerImageName: 'agentic-electron-starter-sandbox:latest',
  claudeDefaultModel: 'claude-opus-4-7',
  codexDefaultModel: 'gpt-5.4',
  claudeAuthMountEnabled: true,
  claudeAuthHostPath: path.join(os.homedir(), '.claude'),
  codexAuthMountEnabled: true,
  codexAuthHostPath: path.join(os.homedir(), '.codex'),
};

export class SQLiteAgentRuntimeSettingsRepository implements AgentRuntimeSettingsRepository {
  async getSettings(): Promise<AgentRuntimeSettings> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT
            docker_image_name AS dockerImageName,
            claude_default_model AS claudeDefaultModel,
            codex_default_model AS codexDefaultModel,
            claude_auth_mount_enabled AS claudeAuthMountEnabled,
            claude_auth_host_path AS claudeAuthHostPath,
            codex_auth_mount_enabled AS codexAuthMountEnabled,
            codex_auth_host_path AS codexAuthHostPath,
            updated_at AS updatedAt
          FROM agent_runtime_settings
          WHERE id = ?
        `,
      )
      .get(SETTINGS_ID) as SettingsRow | undefined;

    if (row) {
      return toSettings(row);
    }

    return this.updateSettings(DEFAULT_SETTINGS, Date.now());
  }

  async updateSettings(
    input: UpdateAgentRuntimeSettings,
    updatedAt: number,
  ): Promise<AgentRuntimeSettings> {
    const current = {
      ...DEFAULT_SETTINGS,
      ...(await this.getExistingSettings()),
      ...input,
      updatedAt,
    };

    getMainDatabase()
      .prepare(
        `
          INSERT INTO agent_runtime_settings (
            id,
            docker_image_name,
            claude_default_model,
            codex_default_model,
            claude_auth_mount_enabled,
            claude_auth_host_path,
            codex_auth_mount_enabled,
            codex_auth_host_path,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            docker_image_name = excluded.docker_image_name,
            claude_default_model = excluded.claude_default_model,
            codex_default_model = excluded.codex_default_model,
            claude_auth_mount_enabled = excluded.claude_auth_mount_enabled,
            claude_auth_host_path = excluded.claude_auth_host_path,
            codex_auth_mount_enabled = excluded.codex_auth_mount_enabled,
            codex_auth_host_path = excluded.codex_auth_host_path,
            updated_at = excluded.updated_at
        `,
      )
      .run(
        SETTINGS_ID,
        current.dockerImageName,
        current.claudeDefaultModel,
        current.codexDefaultModel,
        Number(current.claudeAuthMountEnabled),
        current.claudeAuthHostPath,
        Number(current.codexAuthMountEnabled),
        current.codexAuthHostPath,
        current.updatedAt,
      );

    return current;
  }

  private async getExistingSettings(): Promise<AgentRuntimeSettings | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT
            docker_image_name AS dockerImageName,
            claude_default_model AS claudeDefaultModel,
            codex_default_model AS codexDefaultModel,
            claude_auth_mount_enabled AS claudeAuthMountEnabled,
            claude_auth_host_path AS claudeAuthHostPath,
            codex_auth_mount_enabled AS codexAuthMountEnabled,
            codex_auth_host_path AS codexAuthHostPath,
            updated_at AS updatedAt
          FROM agent_runtime_settings
          WHERE id = ?
        `,
      )
      .get(SETTINGS_ID) as SettingsRow | undefined;

    return row ? toSettings(row) : null;
  }
}

type SettingsRow = {
  dockerImageName: string;
  claudeDefaultModel: string;
  codexDefaultModel: string;
  claudeAuthMountEnabled: number;
  claudeAuthHostPath: string;
  codexAuthMountEnabled: number;
  codexAuthHostPath: string;
  updatedAt: number;
};

function toSettings(row: SettingsRow): AgentRuntimeSettings {
  return {
    dockerImageName: row.dockerImageName,
    claudeDefaultModel: row.claudeDefaultModel,
    codexDefaultModel: row.codexDefaultModel,
    claudeAuthMountEnabled: Boolean(row.claudeAuthMountEnabled),
    claudeAuthHostPath: row.claudeAuthHostPath,
    codexAuthMountEnabled: Boolean(row.codexAuthMountEnabled),
    codexAuthHostPath: row.codexAuthHostPath,
    updatedAt: row.updatedAt,
  };
}
