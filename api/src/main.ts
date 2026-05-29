import Fastify from 'fastify'
import cors from '@fastify/cors'
import { submissionsRoutes } from './routes/submissions.js'
import { rankingRoutes } from './routes/ranking.js'

export function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 })

  app.register(cors, { origin: true })
  app.register(submissionsRoutes, { prefix: '/api' })
  app.register(rankingRoutes, { prefix: '/api' })

  return app
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildApp()
  app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' }, (err) => {
    if (err) { app.log.error(err); process.exit(1) }
  })
}
