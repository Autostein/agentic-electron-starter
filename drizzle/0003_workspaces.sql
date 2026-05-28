DROP INDEX IF EXISTS `projects_path_unique`;
--> statement-breakpoint
DROP INDEX IF EXISTS `projects_updated_at_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `agent_runs_project_id_idx`;
--> statement-breakpoint
ALTER TABLE `projects` RENAME TO `workspaces`;
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_path_unique` ON `workspaces` (`path`);
--> statement-breakpoint
CREATE INDEX `workspaces_updated_at_idx` ON `workspaces` (`updated_at`);
--> statement-breakpoint
ALTER TABLE `agent_runs` RENAME COLUMN `project_id` TO `workspace_id`;
--> statement-breakpoint
ALTER TABLE `agent_runs` RENAME COLUMN `project_path` TO `workspace_path`;
--> statement-breakpoint
ALTER TABLE `agent_runs` RENAME COLUMN `project_name` TO `workspace_name`;
--> statement-breakpoint
CREATE INDEX `agent_runs_workspace_id_idx` ON `agent_runs` (`workspace_id`);
