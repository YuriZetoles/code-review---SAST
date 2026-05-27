import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { submissions, vulnerabilities } from '../db/schema.js'
import { normalizeAll } from '../services/normalizer.js'
import { calculateScore } from '../services/scorer.js'
import { eq } from 'drizzle-orm'
import { emitRankingUpdate } from '../events.js'

const ScanPayloadSchema = z.object({
  group_name: z.string().min(1),
  project_name: z.string().min(1),
  project_version: z.string().min(1),
  tool_versions: z.object({
    syft: z.string(),
    grype: z.string(),
    semgrep: z.string(),
    gitleaks: z.string(),
  }),
  grype: z.object({ matches: z.array(z.any()) }),
  semgrep: z.object({ results: z.array(z.any()) }),
  gitleaks: z.array(z.any()),
})

export async function submissionsRoutes(app: FastifyInstance) {
  app.post('/submissions', async (req, reply) => {
    const parsed = ScanPayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid payload', details: parsed.error.flatten() })
    }

    const payload = parsed.data
    const vulns = normalizeAll(
      payload.grype as any,
      payload.semgrep as any,
      payload.gitleaks as any,
    )
    const { score, breakdown } = calculateScore(vulns)

    const [submission] = await db
      .insert(submissions)
      .values({
        groupName: payload.group_name,
        projectName: payload.project_name,
        projectVersion: payload.project_version,
        score,
        grypeVersion: payload.tool_versions.grype,
        semgrepVersion: payload.tool_versions.semgrep,
        gitleaksVersion: payload.tool_versions.gitleaks,
        rawReport: payload as any,
      })
      .returning()

    if (vulns.length > 0) {
      await db.insert(vulnerabilities).values(
        vulns.map(v => ({
          submissionId: submission.id,
          tool: v.tool,
          severity: v.severity,
          vulnId: v.vulnId,
          package: v.package,
          location: v.location || null,
          description: v.description || null,
          fixAvailable: v.fixAvailable,
        })),
      )
    }

    emitRankingUpdate()

    return reply.status(201).send({ id: submission.id, score, breakdown })
  })

  app.get('/submissions/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))

    if (!submission) return reply.status(404).send({ error: 'Not found' })

    const vulns = await db
      .select()
      .from(vulnerabilities)
      .where(eq(vulnerabilities.submissionId, id))

    return { submission, vulnerabilities: vulns }
  })
}
