import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../src/main.js'

// Mock db before importing routes
vi.mock('../src/db/index.js', () => {
  const mockReturning = vi.fn().mockResolvedValue([{
    id: 'test-uuid-1234',
    groupName: 'Grupo 1',
    projectName: 'meu-app',
    projectVersion: 'abc1234',
    submittedAt: new Date(),
    score: 100,
    grypeVersion: '0.79.0',
    semgrepVersion: '1.72.0',
    gitleaksVersion: '8.18.0',
    rawReport: {},
  }])
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

  // Build a chainable select mock that handles both .where() and .orderBy() endings
  const mockWhere = vi.fn().mockResolvedValue([])
  const mockOrderBy = vi.fn().mockResolvedValue([])
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, orderBy: mockOrderBy })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

  return {
    db: {
      insert: mockInsert,
      select: mockSelect,
    },
  }
})

const minimalPayload = {
  group_name: 'Grupo 1',
  project_name: 'meu-app',
  project_version: 'abc1234',
  tool_versions: { syft: '1.0.0', grype: '0.79.0', semgrep: '1.72.0', gitleaks: '8.18.0' },
  grype: { matches: [] },
  semgrep: { results: [] },
  gitleaks: [],
}

describe('POST /api/submissions', () => {
  it('returns 201 with score and breakdown on valid payload', async () => {
    const app = buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: minimalPayload,
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('score')
    expect(body.score).toBe(100)
    expect(body).toHaveProperty('breakdown')
    await app.close()
  })

  it('returns 400 on missing group_name', async () => {
    const app = buildApp()
    const { group_name, ...noGroup } = minimalPayload
    const res = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: noGroup,
    })
    expect(res.statusCode).toBe(400)
    await app.close()
  })
})

describe('GET /api/ranking', () => {
  it('returns 200 with array', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/ranking' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    await app.close()
  })
})

describe('GET /api/submissions/:id', () => {
  it('returns 404 when submission not found', async () => {
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/submissions/nonexistent-id' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})
