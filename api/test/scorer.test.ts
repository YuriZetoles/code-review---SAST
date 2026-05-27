import { describe, it, expect } from 'vitest'
import { calculateScore } from '../src/services/scorer.js'
import type { Vulnerability } from '../src/types.js'

function makeVuln(tool: Vulnerability['tool'], severity: Vulnerability['severity']): Vulnerability {
  return { tool, severity, vulnId: 'test', package: 'pkg', location: '', description: '', fixAvailable: null }
}

describe('calculateScore', () => {
  it('returns 100 with no vulnerabilities', () => {
    const { score, breakdown } = calculateScore([])
    expect(score).toBe(100)
    expect(breakdown.total).toBe(0)
  })

  it('deducts 20 per critical', () => {
    const { score } = calculateScore([makeVuln('grype', 'critical')])
    expect(score).toBe(80)
  })

  it('deducts 10 per high (non-gitleaks)', () => {
    const { score } = calculateScore([makeVuln('semgrep', 'high')])
    expect(score).toBe(90)
  })

  it('deducts 15 per gitleaks finding regardless of severity', () => {
    const { score, breakdown } = calculateScore([makeVuln('gitleaks', 'high')])
    expect(score).toBe(85)
    expect(breakdown.secrets).toBe(1)
    expect(breakdown.high).toBe(0)
  })

  it('deducts 5 per medium', () => {
    const { score } = calculateScore([makeVuln('grype', 'medium')])
    expect(score).toBe(95)
  })

  it('deducts 1 per low', () => {
    const { score } = calculateScore([makeVuln('grype', 'low')])
    expect(score).toBe(99)
  })

  it('floors at 0 with many vulnerabilities', () => {
    const vulns = Array.from({ length: 10 }, () => makeVuln('grype', 'critical'))
    const { score } = calculateScore(vulns)
    expect(score).toBe(0)
  })

  it('counts breakdown correctly for mixed vulns', () => {
    const vulns = [
      makeVuln('grype', 'critical'),
      makeVuln('grype', 'high'),
      makeVuln('semgrep', 'medium'),
      makeVuln('gitleaks', 'high'),
    ]
    const { score, breakdown } = calculateScore(vulns)
    expect(score).toBe(50) // 100 - 20 - 10 - 5 - 15
    expect(breakdown.critical).toBe(1)
    expect(breakdown.high).toBe(1)
    expect(breakdown.medium).toBe(1)
    expect(breakdown.secrets).toBe(1)
    expect(breakdown.total).toBe(4)
  })
})
