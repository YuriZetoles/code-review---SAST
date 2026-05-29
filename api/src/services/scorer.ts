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

const TOOL_CAPS = {
  grype: 35,
  semgrep: 30,
  gitleaks: 35,
  trivy: 15,
}

export function calculateScore(vulns: Vulnerability[]): ScoreResult {
  const breakdown: ScoreBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    negligible: 0,
    unknown: 0,
    secrets: 0,
    misconfigs: 0,
    total: vulns.length,
  }

  const toolPenalty: Record<string, number> = { grype: 0, semgrep: 0, gitleaks: 0, trivy: 0 }

  for (const v of vulns) {
    if (v.tool === 'gitleaks') {
      breakdown.secrets++
      toolPenalty.gitleaks += SECRET_PENALTY
    } else if (v.tool === 'trivy') {
      breakdown.misconfigs++
      toolPenalty.trivy += PENALTIES[v.severity]
    } else {
      breakdown[v.severity]++
      toolPenalty[v.tool] += PENALTIES[v.severity]
    }
  }

  const penalty =
    Math.min(toolPenalty.grype, TOOL_CAPS.grype) +
    Math.min(toolPenalty.semgrep, TOOL_CAPS.semgrep) +
    Math.min(toolPenalty.gitleaks, TOOL_CAPS.gitleaks) +
    Math.min(toolPenalty.trivy, TOOL_CAPS.trivy)

  return {
    score: Math.max(0, 100 - penalty),
    breakdown,
  }
}
