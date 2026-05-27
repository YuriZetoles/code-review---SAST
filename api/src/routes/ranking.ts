import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { submissions, vulnerabilities } from '../db/schema.js'
import { desc, eq } from 'drizzle-orm'
import { rankingBus } from '../events.js'

async function fetchRanking() {
  const rows = await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.score), submissions.submittedAt)

  return rows.map((s, index) => ({
    rank: index + 1,
    id: s.id,
    group_name: s.groupName,
    project_name: s.projectName,
    project_version: s.projectVersion,
    score: s.score,
    submitted_at: s.submittedAt,
  }))
}

export async function rankingRoutes(app: FastifyInstance) {
  app.get('/ranking', async (_req, reply) => {
    return reply.send(await fetchRanking())
  })

  app.get('/ranking/stream', (req, reply) => {
    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    reply.raw.flushHeaders()

    const send = async () => {
      try {
        const data = await fetchRanking()
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
      } catch {
        // db error — skip this tick
      }
    }

    send()

    const onUpdate = () => { send() }
    rankingBus.on('update', onUpdate)

    const keepAlive = setInterval(() => {
      reply.raw.write(': ping\n\n')
    }, 25000)

    req.raw.on('close', () => {
      rankingBus.off('update', onUpdate)
      clearInterval(keepAlive)
    })
  })

  app.get('/submissions/:id/vulnerabilities', async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { tool?: string; severity?: string }

    const vulns = await db
      .select()
      .from(vulnerabilities)
      .where(eq(vulnerabilities.submissionId, id))

    const filtered = vulns.filter(v => {
      if (query.tool && v.tool !== query.tool) return false
      if (query.severity && v.severity !== query.severity) return false
      return true
    })

    return reply.send(filtered)
  })
}
