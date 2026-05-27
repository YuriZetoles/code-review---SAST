ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "repo_url" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "submissions_group_project_uniq" ON "submissions" ("group_name","project_name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "submissions_repo_url_uniq" ON "submissions" ("repo_url") WHERE "repo_url" IS NOT NULL;
