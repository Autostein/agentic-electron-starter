CREATE TABLE `agent_runtime_profiles` (
	`id` text PRIMARY KEY DEFAULT 'starter' NOT NULL,
	`name` text NOT NULL,
	`source_kind` text NOT NULL,
	`profile_path` text,
	`image_name` text NOT NULL,
	`claude_default_model` text NOT NULL,
	`codex_default_model` text NOT NULL,
	`claude_auth_mount_enabled` integer NOT NULL,
	`codex_auth_mount_enabled` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `agent_runtime_profiles` (
	`id`,
	`name`,
	`source_kind`,
	`profile_path`,
	`image_name`,
	`claude_default_model`,
	`codex_default_model`,
	`claude_auth_mount_enabled`,
	`codex_auth_mount_enabled`,
	`created_at`,
	`updated_at`
)
VALUES (
	'starter',
	'Starter',
	'bundled-starter',
	NULL,
	'agentic-electron-starter-runtime:starter',
	COALESCE((SELECT `claude_default_model` FROM `agent_runtime_settings` WHERE `id` = 'default'), 'claude-opus-4-7'),
	COALESCE((SELECT `codex_default_model` FROM `agent_runtime_settings` WHERE `id` = 'default'), 'gpt-5.4'),
	0,
	0,
	strftime('%s', 'now') * 1000,
	strftime('%s', 'now') * 1000
);
--> statement-breakpoint
ALTER TABLE `agent_runs` ADD `runtime_profile_id` text DEFAULT 'starter' NOT NULL;
--> statement-breakpoint
ALTER TABLE `agent_runs` ADD `runtime_profile_name` text DEFAULT 'Starter' NOT NULL;
--> statement-breakpoint
ALTER TABLE `agent_runs` ADD `runtime_image_name` text DEFAULT 'agentic-electron-starter-runtime:starter' NOT NULL;
