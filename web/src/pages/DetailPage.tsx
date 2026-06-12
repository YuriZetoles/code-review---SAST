import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { VulnList } from '../components/VulnList.js'
import { ScoreBar } from '../components/ScoreBar.js'
import { buildPrompt } from '../lib/buildPrompt.js'
import type { SubmissionDetail, Vulnerability } from '../types.js'

type Tab = 'grype' | 'semgrep' | 'gitleaks' | 'trivy'

const TAB_CONFIG: Record<Tab, { label: string; tooltip: string; icon: React.ReactNode }> = {
  grype: {
    label: 'SCA — Grype',
    tooltip: 'Software Composition Analysis: escaneia dependências em busca de CVEs conhecidos.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  semgrep: {
    label: 'SAST — Semgrep',
    tooltip: 'Static Application Security Testing: analisa o código-fonte em busca de padrões de vulnerabilidade.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  gitleaks: {
    label: 'Secrets — Gitleaks',
    tooltip: 'Detecção de secrets: encontra credenciais, tokens e chaves expostos no código.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  trivy: {
    label: 'IaC — Trivy',
    tooltip: 'Infrastructure as Code: detecta misconfigurations em arquivos de configuração e infraestrutura.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
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
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    api.getSubmission(id)
      .then(setDetail)
      .catch(() => setError('Submissão não encontrada'))
  }, [id])

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
  }, [])

  async function copyPrompt() {
    if (!detail) return
    const text = buildPrompt(detail)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback para contextos sem Clipboard API (ex.: HTTP sem TLS)
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <svg className="w-12 h-12 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-400 font-code text-sm">{error}</p>
        <button onClick={() => navigate('/')} className="text-white hover:text-zinc-300 text-sm font-code cursor-pointer transition-colors">
          Voltar ao ranking
        </button>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-code">Carregando...</p>
        </div>
      </div>
    )
  }

  const { submission, vulnerabilities } = detail
  const tabs: Tab[] = ['grype', 'semgrep', 'gitleaks', 'trivy']
  const vulnsForTab = vulnerabilities.filter((v: Vulnerability) => v.tool === activeTab)

  const tabCounts = tabs.reduce<Record<Tab, number>>((acc, t) => {
    acc[t] = vulnerabilities.filter((v: Vulnerability) => v.tool === t).length
    return acc
  }, {} as Record<Tab, number>)

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 text-sm font-code cursor-pointer transition-colors duration-200 group"
      >
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar ao ranking
      </button>

      {/* Score card */}
      <div className="bg-zinc-900/80 border border-white/15 rounded-2xl p-6 mb-6 ">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold font-code text-zinc-100">{submission.group_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-zinc-400 font-code text-sm">{submission.project_name}</span>
              {submission.project_version && (
                <span className="text-xs font-code text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                  {submission.project_version}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 font-code mt-2">
              {new Date(submission.submitted_at).toLocaleString('pt-BR')}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-5xl font-bold font-code tabular-nums  ${scoreTextColor(submission.score)}`}>
              {submission.score}
            </div>
            <div className="text-zinc-400 text-xs font-code">/ 100 pts</div>
          </div>
        </div>

        <ScoreBar score={submission.score} showLabel={false} />

{/* Tool versions */}
        {(submission.grype_version || submission.semgrep_version || submission.gitleaks_version || submission.trivy_version) && (
          <div className="flex flex-wrap gap-3 mt-3 text-xs font-code text-zinc-500">
            {submission.grype_version && <span>Grype {submission.grype_version}</span>}
            {submission.semgrep_version && <span>Semgrep {submission.semgrep_version}</span>}
            {submission.gitleaks_version && <span>Gitleaks {submission.gitleaks_version}</span>}
            {submission.trivy_version && <span>Trivy {submission.trivy_version}</span>}
          </div>
        )}
      </div>

      {/* Copy prompt button */}
      <div className="flex justify-end mb-4">
        <div className="relative group/copy">
          <button
            onClick={copyPrompt}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-code border transition-all duration-150 cursor-pointer ${
              copied
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60 hover:border-zinc-500 hover:text-white'
            }`}
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {copied ? 'Copiado!' : 'Copiar prompt para IA'}
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 w-72 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 font-sans leading-relaxed pointer-events-none opacity-0 group-hover/copy:opacity-100 transition-opacity duration-150 z-10 shadow-lg">
            Copia o relatório completo das 4 ferramentas em formato de prompt, pronto para colar em agentes de IA (Claude Code, Copilot, etc.) e corrigir as vulnerabilidades.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {tabs.map(tab => {
          const cfg = TAB_CONFIG[tab]
          const isActive = activeTab === tab
          return (
            <div key={tab} className="relative group/tab">
              <button
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-code transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/25'
                    : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {cfg.icon}
                <span className="hidden sm:inline">{cfg.label}</span>
                <span className="sm:hidden">{cfg.label.split(' — ')[0]}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                  isActive ? 'bg-white/15 text-zinc-300' : 'bg-zinc-700/60 text-zinc-400'
                }`}>
                  {tabCounts[tab]}
                </span>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 font-sans leading-relaxed pointer-events-none opacity-0 group-hover/tab:opacity-100 transition-opacity duration-150 z-10 text-center shadow-lg">
                {cfg.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
              </div>
            </div>
          )
        })}
      </div>

      <VulnList vulns={vulnsForTab} />
    </div>
  )
}
