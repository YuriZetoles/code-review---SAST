import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

const groups = [
  { groupName: 'Grupo 1', projectName: 'ecommerce-api', score: 85, critical: 0, high: 1, medium: 2 },
  { groupName: 'Grupo 2', projectName: 'auth-service', score: 42, critical: 2, high: 3, medium: 1 },
  { groupName: 'Grupo 3', projectName: 'payment-gateway', score: 0, critical: 4, high: 2, medium: 3 },
  { groupName: 'Grupo 4', projectName: 'user-dashboard', score: 71, critical: 1, high: 1, medium: 0 },
  { groupName: 'Grupo 5', projectName: 'notification-svc', score: 95, critical: 0, high: 0, medium: 1 },
]

for (const g of groups) {
  const [sub] = await db.insert(schema.submissions).values({
    groupName: g.groupName,
    projectName: g.projectName,
    projectVersion: '1.0.0',
    score: g.score,
    grypeVersion: '0.78.0',
    semgrepVersion: '1.72.0',
    gitleaksVersion: '8.18.2',
  }).returning()

  const vulns: (typeof schema.vulnerabilities.$inferInsert)[] = []

  for (let i = 0; i < g.critical; i++) {
    vulns.push({ submissionId: sub.id, tool: 'grype', severity: 'critical', vulnId: `CVE-2024-${1000 + i}`, package: `log4j-core-${i}`, description: 'Remote code execution via JNDI lookup', fixAvailable: '2.17.1' })
  }
  for (let i = 0; i < g.high; i++) {
    vulns.push({ submissionId: sub.id, tool: 'semgrep', severity: 'high', vulnId: `SEMGREP-HIGH-${i}`, package: `express@4.${i}`, description: 'SQL injection via unsanitized input', location: `src/routes/user.ts:${10 + i}` })
  }
  for (let i = 0; i < g.medium; i++) {
    vulns.push({ submissionId: sub.id, tool: 'grype', severity: 'medium', vulnId: `CVE-2023-${500 + i}`, package: `axios@1.${i}`, description: 'SSRF vulnerability', fixAvailable: '1.6.0' })
  }

  if (vulns.length > 0) await db.insert(schema.vulnerabilities).values(vulns)

  console.log(`✓ ${g.groupName} — score ${g.score}`)
}

await pool.end()
console.log('Seed concluído.')
