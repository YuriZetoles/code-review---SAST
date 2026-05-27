import { describe, it, expect } from 'vitest'
import { normalizeGrype, normalizeSemgrep, normalizeGitleaks, normalizeAll } from '../src/services/normalizer.js'
import type { GrypeOutput, SemgrepOutput, GitleaksOutput } from '../src/types.js'

const grypeFixture: GrypeOutput = {
  matches: [
    {
      vulnerability: {
        id: 'CVE-2021-23369',
        severity: 'Critical',
        description: 'Prototype pollution',
        fix: { versions: ['4.17.21'] },
      },
      artifact: { name: 'lodash', version: '4.17.20' },
    },
    {
      vulnerability: {
        id: 'CVE-2022-0001',
        severity: 'High',
        description: 'RCE in axios',
        fix: { versions: [] },
      },
      artifact: { name: 'axios', version: '0.21.1' },
    },
  ],
}

const semgrepFixture: SemgrepOutput = {
  results: [
    {
      check_id: 'javascript.lang.security.audit.eval',
      path: 'src/utils.js',
      start: { line: 42 },
      extra: { message: 'eval() is dangerous', severity: 'ERROR' },
    },
    {
      check_id: 'javascript.lang.security.audit.xss',
      path: 'src/render.js',
      start: { line: 10 },
      extra: { message: 'Possible XSS', severity: 'WARNING' },
    },
  ],
}

const gitleaksFixture: GitleaksOutput = [
  {
    RuleID: 'generic-api-key',
    Description: 'Generic API Key',
    File: 'config.js',
    StartLine: 5,
    Secret: 'sk-abc123',
    Match: 'API_KEY = sk-abc123',
  },
]

describe('normalizeGrype', () => {
  it('maps Critical severity correctly', () => {
    const result = normalizeGrype(grypeFixture)
    expect(result[0].severity).toBe('critical')
    expect(result[0].tool).toBe('grype')
    expect(result[0].vulnId).toBe('CVE-2021-23369')
    expect(result[0].package).toBe('lodash@4.17.20')
    expect(result[0].fixAvailable).toBe('4.17.21')
  })

  it('sets fixAvailable to null when no fix versions', () => {
    const result = normalizeGrype(grypeFixture)
    expect(result[1].fixAvailable).toBeNull()
  })

  it('maps High severity correctly', () => {
    const result = normalizeGrype(grypeFixture)
    expect(result[1].severity).toBe('high')
  })
})

describe('normalizeSemgrep', () => {
  it('maps ERROR to high severity', () => {
    const result = normalizeSemgrep(semgrepFixture)
    expect(result[0].severity).toBe('high')
    expect(result[0].tool).toBe('semgrep')
    expect(result[0].vulnId).toBe('javascript.lang.security.audit.eval')
    expect(result[0].location).toBe('src/utils.js:42')
  })

  it('maps WARNING to medium severity', () => {
    const result = normalizeSemgrep(semgrepFixture)
    expect(result[1].severity).toBe('medium')
  })
})

describe('normalizeGitleaks', () => {
  it('always sets severity to high', () => {
    const result = normalizeGitleaks(gitleaksFixture)
    expect(result[0].severity).toBe('high')
    expect(result[0].tool).toBe('gitleaks')
    expect(result[0].vulnId).toBe('generic-api-key')
    expect(result[0].location).toBe('config.js:5')
    expect(result[0].fixAvailable).toBeNull()
  })
})

describe('normalizeAll', () => {
  it('concatenates all tools', () => {
    const result = normalizeAll(grypeFixture, semgrepFixture, gitleaksFixture)
    expect(result).toHaveLength(5)
    expect(result.filter(v => v.tool === 'grype')).toHaveLength(2)
    expect(result.filter(v => v.tool === 'semgrep')).toHaveLength(2)
    expect(result.filter(v => v.tool === 'gitleaks')).toHaveLength(1)
  })
})
