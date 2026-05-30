export interface RankingEntry {
  rank: number
  id: string
  group_name: string
  project_name: string
  project_version: string
  score: number
  submitted_at: string
  cves: number
  sast: number
  secrets: number
  misconfigs: number
}

export interface Vulnerability {
  id: string
  submission_id: string
  tool: 'grype' | 'semgrep' | 'gitleaks' | 'trivy'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'negligible' | 'unknown'
  vuln_id: string
  package: string
  location: string | null
  description: string | null
  fix_available: string | null
}

export interface Submission {
  id: string
  group_name: string
  project_name: string
  project_version: string
  submitted_at: string
  score: number
  grype_version: string | null
  semgrep_version: string | null
  gitleaks_version: string | null
}

export interface SubmissionDetail {
  submission: Submission
  vulnerabilities: Vulnerability[]
}
