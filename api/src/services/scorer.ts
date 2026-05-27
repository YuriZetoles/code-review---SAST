import type { Vulnerability, ScoreResult, ScoreBreakdown } from '../types.js'

const PENALTIES: Record<string, number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 1,
  negligible: 0,
  unknown: 0,
}

const SECRET_PENALTY = 15

export function calculateScore(vulns: Vulnerability[]): ScoreResult {
  const breakdown: ScoreBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    negligible: 0,
    unknown: 0,
    secrets: 0,
    total: vulns.length,
  }

  let penalty = 0

  for (const v of vulns) {
    if (v.tool === 'gitleaks') {
      breakdown.secrets++
      penalty += SECRET_PENALTY
    } else {
      breakdown[v.severity]++
      penalty += PENALTIES[v.severity]
    }
  }

  return {
    score: Math.max(0, 100 - penalty),
    breakdown,
  }
}
