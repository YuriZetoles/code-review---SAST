import { pgTable, uuid, varchar, timestamp, integer, text, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'

export const toolEnum = pgEnum('tool', ['grype', 'semgrep', 'gitleaks', 'trivy'])
export const severityEnum = pgEnum('severity', ['critical', 'high', 'medium', 'low', 'negligible', 'unknown'])

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupName: varchar('group_name', { length: 100 }).notNull(),
  projectName: varchar('project_name', { length: 200 }).notNull(),
  projectVersion: varchar('project_version', { length: 50 }).notNull(),
  repoUrl: text('repo_url'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  score: integer('score').notNull(),
  grypeVersion: varchar('grype_version', { length: 50 }),
  semgrepVersion: varchar('semgrep_version', { length: 50 }),
  gitleaksVersion: varchar('gitleaks_version', { length: 50 }),
  trivyVersion: varchar('trivy_version', { length: 50 }),
}, (t) => ({
  groupProjectUniq: uniqueIndex('submissions_group_project_uniq').on(t.groupName, t.projectName),
  repoUrlUniq: uniqueIndex('submissions_repo_url_uniq').on(t.repoUrl),
}))

export const vulnerabilities = pgTable('vulnerabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  tool: toolEnum('tool').notNull(),
  severity: severityEnum('severity').notNull(),
  vulnId: text('vuln_id').notNull(),
  package: varchar('package', { length: 200 }).notNull(),
  location: varchar('location', { length: 500 }),
  description: text('description'),
  fixAvailable: text('fix_available'),
})
