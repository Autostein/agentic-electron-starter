CREATE TABLE `agent_run_commits` (
	`run_id` text NOT NULL,
	`sha` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_run_commits_run_id_idx` ON `agent_run_commits` (`run_id`);--> statement-breakpoint
CREATE TABLE `agent_run_events` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_run_events_run_id_idx` ON `agent_run_events` (`run_id`);--> statement-breakpoint
CREATE INDEX `agent_run_events_created_at_idx` ON `agent_run_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `agent_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`project_path` text NOT NULL,
	`project_name` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`prompt` text NOT NULL,
	`max_iterations` integer NOT NULL,
	`status` text NOT NULL,
	`branch_name` text NOT NULL,
	`log_file_path` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `agent_runs_project_id_idx` ON `agent_runs` (`project_id`);--> statement-breakpoint
CREATE INDEX `agent_runs_created_at_idx` ON `agent_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `agent_runs_status_idx` ON `agent_runs` (`status`);--> statement-breakpoint
CREATE TABLE `agent_runtime_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`docker_image_name` text NOT NULL,
	`claude_default_model` text NOT NULL,
	`codex_default_model` text NOT NULL,
	`claude_auth_mount_enabled` integer NOT NULL,
	`claude_auth_host_path` text NOT NULL,
	`codex_auth_mount_enabled` integer NOT NULL,
	`codex_auth_host_path` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`name` text NOT NULL,
	`current_branch` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_unique` ON `projects` (`path`);--> statement-breakpoint
CREATE INDEX `projects_updated_at_idx` ON `projects` (`updated_at`);