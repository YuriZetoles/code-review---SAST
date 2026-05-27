import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { VulnList } from '../components/VulnList.js'
import { ScoreBar } from '../components/ScoreBar.js'
import type { SubmissionDetail, Vulnerability } from '../types.js'

type Tab = 'grype' | 'semgrep' | 'gitleaks'

const TAB_CONFIG: Record<Tab, { label: string; icon: React.ReactNode }> = {
  grype: {
    label: 'SCA — Grype',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  semgrep: {
    label: 'SAST — Semgrep',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  gitleaks: {
    label: 'Secrets — Gitleaks',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
}

function scoreTextColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SubmissionDetail | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('grype')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getSubmission(id)
      .then(setDetail)
      .catch(() => setError('Submissão não encontrada'))
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <svg className="w-12 h-12 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-400 font-code text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="text-green-400 hover:text-green-300 text-sm font-code cursor-pointer transition-colors">
          voltar ao ranking
        </button>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-code">carregando...</p>
        </div>
      </div>
    )
  }

  const { submission, vulnerabilities } = detail
  const tabs: Tab[] = ['grype', 'semgrep', 'gitleaks']
  const vulnsForTab = vulnerabilities.filter((v: Vulnerability) => v.tool === activeTab)

  const countBySeverity = (vulns: Vulnerability[]) =>
    vulns.reduce<Record<string, number>>((acc, v) => {
      acc[v.severity] = (acc[v.severity] ?? 0) + 1
      return acc
    }, {})

  const tabCounts = tabs.reduce<Record<Tab, number>>((acc, t) => {
    acc[t] = vulnerabilities.filter((v: Vulnerability) => v.tool === t).length
    return acc
  }, {} as Record<Tab, number>)

  const globalCounts = countBySeverity(vulnerabilities)

  return (
    <div className="max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-green-400 mb-6 text-sm font-code cursor-pointer transition-colors duration-200 group"
      >
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        voltar ao ranking
      </button>

      {/* Score card */}
      <div className="bg-slate-900/80 border border-green-500/20 rounded-2xl p-6 mb-6 neon-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold font-code text-slate-100">{submission.group_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-400 font-code text-sm">{submission.project_name}</span>
              {submission.project_version && (
                <span className="text-xs font-code text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {submission.project_version}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 font-code mt-2">
              {new Date(submission.submitted_at).toLocaleString('pt-BR')}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-5xl font-bold font-code tabular-nums neon-text ${scoreTextColor(submission.score)}`}>
              {submission.score}
            </div>
            <div className="text-slate-600 text-xs font-code">/ 100 pts</div>
          </div>
        </div>

        <ScoreBar score={submission.score} />

        {/* Severity summary */}
        {Object.keys(globalCounts).length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-800/60">
            {['critical', 'high', 'medium', 'low'].filter(s => globalCounts[s]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`text-xs font-code uppercase tracking-wide ${
                  s === 'critical' ? 'text-red-400' :
                  s === 'high' ? 'text-orange-400' :
                  s === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {globalCounts[s]}x {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tool versions */}
        {(submission.grype_version || submission.semgrep_version || submission.gitleaks_version) && (
          <div className="flex flex-wrap gap-3 mt-3 text-xs font-code text-slate-700">
            {submission.grype_version && <span>grype {submission.grype_version}</span>}
            {submission.semgrep_version && <span>semgrep {submission.semgrep_version}</span>}
            {submission.gitleaks_version && <span>gitleaks {submission.gitleaks_version}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const cfg = TAB_CONFIG[tab]
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-code transition-all duration-150 whitespace-nowrap cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-green-500/15 text-green-400 border border-green-500/40'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/60 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {cfg.icon}
              {cfg.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                isActive ? 'bg-green-500/20 text-green-300' : 'bg-slate-700/60 text-slate-600'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          )
        })}
      </div>

      <VulnList vulns={vulnsForTab} />
    </div>
  )
}
