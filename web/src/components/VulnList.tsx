import { useState } from 'react'
import type { Vulnerability } from '../types.js'

const SEVERITY_STYLE: Record<string, { badge: string; dot: string }> = {
  critical:   { badge: 'text-red-400 bg-red-500/10 border border-red-500/30',         dot: 'bg-red-500' },
  high:       { badge: 'text-orange-400 bg-orange-500/10 border border-orange-500/30', dot: 'bg-orange-400' },
  medium:     { badge: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30', dot: 'bg-yellow-400' },
  low:        { badge: 'text-blue-400 bg-blue-500/10 border border-blue-500/30',       dot: 'bg-blue-400' },
  negligible: { badge: 'text-zinc-400 bg-zinc-800 border border-zinc-700',             dot: 'bg-slate-600' },
  unknown:    { badge: 'text-zinc-400 bg-zinc-800 border border-zinc-700',             dot: 'bg-slate-600' },
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'negligible', 'unknown']

const NOMINAL_PENALTY: Record<string, number> = {
  critical: 20, high: 10, medium: 5, low: 1, negligible: 0, unknown: 0,
}
const TOOL_CAP: Record<string, number> = {
  grype: 35, semgrep: 30, gitleaks: 35, trivy: 15,
}

function nominalPenalty(v: Vulnerability): number {
  return v.tool === 'gitleaks' ? 15 : (NOMINAL_PENALTY[v.severity] ?? 0)
}

interface PenaltyResult {
  totalNominal: number
  totalEffective: number
  capHit: boolean
}

function calcPenalties(vulns: Vulnerability[]): PenaltyResult {
  const tool = vulns[0]?.tool
  if (!tool) return { totalNominal: 0, totalEffective: 0, capHit: false }
  const cap = TOOL_CAP[tool] ?? Infinity
  const totalNominal = vulns.reduce((sum, v) => sum + nominalPenalty(v), 0)
  const totalEffective = Math.min(totalNominal, cap)
  return { totalNominal, totalEffective, capHit: totalNominal > cap }
}

const TOOL_BADGE: Record<string, string> = {
  grype:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  semgrep:  'text-violet-400 bg-violet-500/10 border-violet-500/30',
  gitleaks: 'text-red-400 bg-red-500/10 border-red-500/30',
  trivy:    'text-pink-400 bg-pink-500/10 border-pink-500/30',
}

const PAGE_SIZE = 50

interface VulnListProps {
  vulns: Vulnerability[]
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function VulnList({ vulns }: VulnListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [page, setPage]         = useState(0)

  const { totalNominal, totalEffective, capHit } = calcPenalties(vulns)

  const sorted = vulns
    .slice()
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (vulns.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-10 h-10 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-zinc-500 text-sm font-code">Nenhuma vulnerabilidade encontrada</p>
      </div>
    )
  }

  return (
    <div>
      {totalNominal > 0 && (
        <div className="mb-4 px-1 text-xs font-code text-zinc-500">
          Soma das penalidades: <span className="text-zinc-300">−{totalNominal} pts</span>
          <span className="mx-2">·</span>
          Impacto no score: <span className="text-zinc-300">−{totalEffective} pts</span>
          {capHit && <span className="ml-1">· Limite da ferramenta atingido</span>}
        </div>
      )}
      <div className="space-y-1.5">
        {paginated.map(v => {
          const style = SEVERITY_STYLE[v.severity] ?? SEVERITY_STYLE.unknown
          const isOpen = expanded.has(v.id)
          return (
            <div
              key={v.id}
              className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-white/20 bg-zinc-900/80'
                  : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/60'
              }`}
            >
              <button
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev)
                  isOpen ? next.delete(v.id) : next.add(v.id)
                  return next
                })}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold font-code uppercase tracking-wide flex-shrink-0 ${style.badge}`}>
                  {v.severity}
                </span>
                <span className="font-code text-sm text-zinc-300 truncate flex-1 min-w-0">{v.vuln_id}</span>
                {nominalPenalty(v) > 0 && (
                  <span className="text-xs font-code text-zinc-500 flex-shrink-0 tabular-nums">
                    −{nominalPenalty(v)} pts
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-xs font-code border flex-shrink-0 hidden sm:block ${TOOL_BADGE[v.tool] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                  {v.tool}
                </span>
                {v.package && (
                  <span className="text-xs text-zinc-500 font-code truncate hidden sm:block flex-shrink-0 max-w-[160px]">
                    {v.package}
                  </span>
                )}
                <ChevronIcon open={isOpen} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-800/40 space-y-2">
                  {v.location && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-code text-zinc-400 break-all">{v.location}</span>
                    </div>
                  )}
                  {v.description && (
                    <p className="text-sm text-zinc-300 leading-relaxed">{v.description}</p>
                  )}
                  {v.fix_available && (
                    <div className="flex items-center gap-2 mt-2">
                      <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-white font-code">fix: {v.fix_available}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-800/60">
          <span className="text-xs text-zinc-500 font-code">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(p => p - 1); setExpanded(new Set()) }}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-code border border-zinc-700/60 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-600 hover:text-zinc-300 transition-all cursor-pointer"
            >
              ← anterior
            </button>
            <button
              onClick={() => { setPage(p => p + 1); setExpanded(new Set()) }}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-code border border-zinc-700/60 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-600 hover:text-zinc-300 transition-all cursor-pointer"
            >
              próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
