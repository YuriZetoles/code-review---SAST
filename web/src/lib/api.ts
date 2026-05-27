import type { RankingEntry, SubmissionDetail, Vulnerability } from '../types.js'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const api = {
  getRanking: () => get<RankingEntry[]>('/api/ranking'),
  getSubmission: (id: string) => get<SubmissionDetail>(`/api/submissions/${id}`),
  getVulnerabilities: (id: string, params?: { tool?: string; severity?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return get<Vulnerability[]>(`/api/submissions/${id}/vulnerabilities${qs}`)
  },
}
