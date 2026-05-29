import type { GrypeOutput, GitleaksOutput, SemgrepOutput, TrivyOutput, Vulnerability, Severity } from '../types.js'

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

function mapTrivySeverity(s: string): Severity {
  const map: Record<string, Severity> = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  }
  return map[s?.toUpperCase()] ?? 'unknown'
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

export function normalizeTrivy(output: TrivyOutput): Vulnerability[] {
  if (!output?.Results) return []
  const vulns: Vulnerability[] = []
  for (const result of output.Results) {
    for (const m of result.Misconfigurations ?? []) {
      if (m.Status !== 'FAIL') continue
      vulns.push({
        tool: 'trivy' as const,
        severity: mapTrivySeverity(m.Severity),
        vulnId: m.ID,
        package: result.Target,
        location: result.Target,
        description: m.Message || m.Description || m.Title || '',
        fixAvailable: m.Resolution || null,
      })
    }
  }
  return vulns
}

export function normalizeAll(
  grype: GrypeOutput,
  semgrep: SemgrepOutput,
  gitleaks: GitleaksOutput,
  trivy: TrivyOutput,
): Vulnerability[] {
  return [
    ...normalizeGrype(grype),
    ...normalizeSemgrep(semgrep),
    ...normalizeGitleaks(gitleaks),
    ...normalizeTrivy(trivy),
  ]
}
