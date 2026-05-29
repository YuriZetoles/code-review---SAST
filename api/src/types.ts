export type Tool = 'grype' | 'semgrep' | 'gitleaks' | 'trivy'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'negligible' | 'unknown'

export interface GrypeMatch {
  vulnerability: {
    id: string
    severity: string
    description: string
    fix: { versions: string[] }
  }
  artifact: { name: string; version: string }
}

export interface GrypeOutput {
  matches: GrypeMatch[]
}

export interface SemgrepResult {
  check_id: string
  path: string
  start: { line: number }
  extra: { message: string; severity: string }
}

export interface SemgrepOutput {
  results: SemgrepResult[]
}

export interface GitleaksFinding {
  RuleID: string
  Description: string
  File: string
  StartLine: number
  Secret: string
  Match: string
}

export type GitleaksOutput = GitleaksFinding[]

export interface TrivyMisconfiguration {
  ID: string
  Title: string
  Description: string
  Message: string
  Resolution: string
  Severity: string
  Status: string
}

export interface TrivyResult {
  Target: string
  Class: string
  Type: string
  Misconfigurations?: TrivyMisconfiguration[]
}

export interface TrivyOutput {
  SchemaVersion: number
  Results: TrivyResult[]
}

export interface ScanPayload {
  group_name: string
  project_name: string
  project_version: string
  tool_versions: {
    syft: string
    grype: string
    semgrep: string
    gitleaks: string
    trivy: string
  }
  grype: GrypeOutput
  semgrep: SemgrepOutput
  gitleaks: GitleaksOutput
  trivy: TrivyOutput
}

export interface Vulnerability {
  tool: Tool
  severity: Severity
  vulnId: string
  package: string
  location: string
  description: string
  fixAvailable: string | null
}

export interface ScoreBreakdown {
  critical: number
  high: number
  medium: number
  low: number
  negligible: number
  unknown: number
  secrets: number
  misconfigs: number
  total: number
}

export interface ScoreResult {
  score: number
  breakdown: ScoreBreakdown
}
