DO $$ BEGIN
 CREATE TYPE "public"."severity" AS ENUM('critical', 'high', 'medium', 'low', 'negligible', 'unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tool" AS ENUM('grype', 'semgrep', 'gitleaks');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_name" varchar(100) NOT NULL,
	"project_name" varchar(200) NOT NULL,
	"project_version" varchar(50) NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"score" integer NOT NULL,
	"grype_version" varchar(50),
	"semgrep_version" varchar(50),
	"gitleaks_version" varchar(50),
	"raw_report" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vulnerabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"tool" "tool" NOT NULL,
	"severity" "severity" NOT NULL,
	"vuln_id" varchar(100) NOT NULL,
	"package" varchar(200) NOT NULL,
	"location" varchar(500),
	"description" text,
	"fix_available" varchar(100)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
