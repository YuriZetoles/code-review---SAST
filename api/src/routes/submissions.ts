import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { submissions, vulnerabilities } from '../db/schema.js'
import { normalizeAll } from '../services/normalizer.js'
import { calculateScore } from '../services/scorer.js'
import { eq, and, ne } from 'drizzle-orm'
import { emitRankingUpdate } from '../events.js'

const ScanPayloadSchema = z.object({
  group_name: z.string().min(1),
  project_name: z.string().min(1),
  project_version: z.string().min(1),
  repo_url: z.string().url().optional().nullable(),
  tool_versions: z.object({
    syft: z.string(),
    grype: z.string(),
    semgrep: z.string(),
    gitleaks: z.string(),
    trivy: z.string().optional().default('unknown'),
  }),
  grype: z.object({ matches: z.array(z.any()) }),
  semgrep: z.object({ results: z.array(z.any()) }),
  gitleaks: z.array(z.any()),
  trivy: z.object({ Results: z.array(z.any()) }).optional().default({ Results: [] }),
})

export async function submissionsRoutes(app: FastifyInstance) {
  app.post('/submissions', async (req, reply) => {
    const parsed = ScanPayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid payload', details: parsed.error.flatten() })
    }

    const payload = parsed.data
    const repoUrl = payload.repo_url ?? null

    // Bloqueia se repo_url já registrado por outro grupo
    if (repoUrl) {
      const [existing] = await db
        .select({ id: submissions.id, groupName: submissions.groupName })
        .from(submissions)
        .where(and(eq(submissions.repoUrl, repoUrl), ne(submissions.groupName, payload.group_name)))

      if (existing) {
        return reply.status(409).send({
          error: 'Projeto já registrado',
          detail: `Este repositório já foi registrado pelo grupo "${existing.groupName}".`,
        })
      }
    }

    const vulns = normalizeAll(
      payload.grype as any,
      payload.semgrep as any,
      payload.gitleaks as any,
      payload.trivy as any,
    )
    const { score, breakdown } = calculateScore(vulns)

    // Upsert: mesmo grupo + mesmo projeto_name → atualiza
    const [existing] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.groupName, payload.group_name), eq(submissions.projectName, payload.project_name)))

    let submission: typeof submissions.$inferSelect

    if (existing) {
      await db.delete(vulnerabilities).where(eq(vulnerabilities.submissionId, existing.id));
      [submission] = await db
        .update(submissions)
        .set({
          projectVersion: payload.project_version,
          repoUrl,
          score,
          grypeVersion: payload.tool_versions.grype,
          semgrepVersion: payload.tool_versions.semgrep,
          gitleaksVersion: payload.tool_versions.gitleaks,
          trivyVersion: payload.tool_versions.trivy,
          submittedAt: new Date(),
        })
        .where(eq(submissions.id, existing.id))
        .returning()
    } else {
      [submission] = await db
        .insert(submissions)
        .values({
          groupName: payload.group_name,
          projectName: payload.project_name,
          projectVersion: payload.project_version,
          repoUrl,
          score,
          grypeVersion: payload.tool_versions.grype,
          semgrepVersion: payload.tool_versions.semgrep,
          gitleaksVersion: payload.tool_versions.gitleaks,
          trivyVersion: payload.tool_versions.trivy,
        })
        .returning()
    }

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

    return {
      submission: {
        id: submission.id,
        group_name: submission.groupName,
        project_name: submission.projectName,
        project_version: submission.projectVersion,
        submitted_at: submission.submittedAt,
        score: submission.score,
        grype_version: submission.grypeVersion,
        semgrep_version: submission.semgrepVersion,
        gitleaks_version: submission.gitleaksVersion,
        trivy_version: submission.trivyVersion,
      },
      vulnerabilities: vulns.map(v => ({
        id: v.id,
        submission_id: v.submissionId,
        tool: v.tool,
        severity: v.severity,
        vuln_id: v.vulnId,
        package: v.package,
        location: v.location,
        description: v.description,
        fix_available: v.fixAvailable,
      })),
    }
  })
}
