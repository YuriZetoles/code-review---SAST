import type { GrypeOutput, GitleaksOutput, SemgrepOutput, Vulnerability, Severity } from '../types.js'

function mapGrypeSeverity(s: string): Severity {
  const map: Record<string, Severity> = {
    Critical: 'critical',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
    Negligible: 'negligible',
    Unknown: 'unknown',
  }
  return map[s] ?? 'unknown'
}

function mapSemgrepSeverity(s: string): Severity {
  if (s === 'ERROR') return 'high'
  if (s === 'WARNING') return 'medium'
  return 'low'
}

export function normalizeGrype(output: GrypeOutput): Vulnerability[] {
  return output.matches.map(m => ({
    tool: 'grype' as const,
    severity: mapGrypeSeverity(m.vulnerability.severity),
    vulnId: m.vulnerability.id,
    package: `${m.artifact.name}@${m.artifact.version}`,
    location: '',
    description: m.vulnerability.description ?? '',
    fixAvailable: m.vulnerability.fix.versions[0] ?? null,
  }))
}

export function normalizeSemgrep(output: SemgrepOutput): Vulnerability[] {
  return output.results.map(r => ({
    tool: 'semgrep' as const,
    severity: mapSemgrepSeverity(r.extra.severity),
    vulnId: r.check_id,
    package: r.path,
    location: `${r.path}:${r.start.line}`,
    description: r.extra.message,
    fixAvailable: null,
  }))
}

export function normalizeGitleaks(output: GitleaksOutput): Vulnerability[] {
  return output.map(f => ({
    tool: 'gitleaks' as const,
    severity: 'high' as const,
    vulnId: f.RuleID,
    package: f.File,
    location: `${f.File}:${f.StartLine}`,
    description: f.Description,
    fixAvailable: null,
  }))
}

export function normalizeAll(
  grype: GrypeOutput,
  semgrep: SemgrepOutput,
  gitleaks: GitleaksOutput,
): Vulnerability[] {
  return [
    ...normalizeGrype(grype),
    ...normalizeSemgrep(semgrep),
    ...normalizeGitleaks(gitleaks),
  ]
}
