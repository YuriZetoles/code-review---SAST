import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { submissions, vulnerabilities } from '../db/schema.js'
import { desc, eq } from 'drizzle-orm'

export async function rankingRoutes(app: FastifyInstance) {
  app.get('/ranking', async (_req, reply) => {
    const rows = await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.score), submissions.submittedAt)

    const ranking = rows.map((s, index) => ({
      rank: index + 1,
      id: s.id,
      group_name: s.groupName,
      project_name: s.projectName,
      project_version: s.projectVersion,
      score: s.score,
      submitted_at: s.submittedAt,
    }))

    return reply.send(ranking)
  })

  app.get('/submissions/:id/vulnerabilities', async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { tool?: string; severity?: string }

    const baseQuery = db
      .select()
      .from(vulnerabilities)
      .where(eq(vulnerabilities.submissionId, id))

    const vulns = await baseQuery

    const filtered = vulns.filter(v => {
      if (query.tool && v.tool !== query.tool) return false
      if (query.severity && v.severity !== query.severity) return false
      return true
    })

    return reply.send(filtered)
  })
}
