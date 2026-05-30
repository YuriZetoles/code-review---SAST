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

const TOOL_BADGE: Record<string, string> = {
  grype:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  semgrep:  'text-violet-400 bg-violet-500/10 border-violet-500/30',
  gitleaks: 'text-red-400 bg-red-500/10 border-red-500/30',
  trivy:    'text-pink-400 bg-pink-500/10 border-pink-500/30',
}

const TOOL_FILTER_STYLE: Record<string, string> = {
  grype:    'text-cyan-400 bg-cyan-500/15 border border-cyan-500/40',
  semgrep:  'text-violet-400 bg-violet-500/15 border border-violet-500/40',
  gitleaks: 'text-red-400 bg-red-500/15 border border-red-500/40',
  trivy:    'text-pink-400 bg-pink-500/15 border border-pink-500/40',
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
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [filterSev, setFilterSev]   = useState<string>('all')
  const [filterTool, setFilterTool] = useState<string>('all')
  const [onlyFixed, setOnlyFixed]   = useState(false)
  const [page, setPage]             = useState(0)

  function resetPage() { setPage(0); setExpanded(new Set()) }

  const sevCounts = vulns.reduce<Record<string, number>>((acc, v) => {
    acc[v.severity] = (acc[v.severity] ?? 0) + 1
    return acc
  }, {})

  const toolCounts = vulns.reduce<Record<string, number>>((acc, v) => {
    acc[v.tool] = (acc[v.tool] ?? 0) + 1
    return acc
  }, {})

  const activeSeverities = SEVERITY_ORDER.filter(s => sevCounts[s] > 0)
  const activeTools = ['grype', 'semgrep', 'gitleaks', 'trivy'].filter(t => toolCounts[t] > 0)

  const filtered = vulns
    .filter(v => filterSev === 'all'  || v.severity === filterSev)
    .filter(v => filterTool === 'all' || v.tool === filterTool)
    .filter(v => !onlyFixed || v.fix_available !== null)
    .slice()
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      {/* Filtro de severidade */}
      {activeSeverities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => { setFilterSev('all'); resetPage() }}
            className={`px-3 py-1.5 rounded-lg text-xs font-code transition-all duration-150 cursor-pointer ${
              filterSev === 'all'
                ? 'bg-zinc-700/60 text-zinc-300 border border-zinc-600/60'
                : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            todos
            <span className="ml-1.5 opacity-60">{vulns.length}</span>
          </button>
          {activeSeverities.map(s => {
            const style = SEVERITY_STYLE[s] ?? SEVERITY_STYLE.unknown
            return (
              <button
                key={s}
                onClick={() => { setFilterSev(filterSev === s ? 'all' : s); resetPage() }}
                className={`px-3 py-1.5 rounded-lg text-xs font-code transition-all duration-150 cursor-pointer capitalize ${
                  filterSev === s ? style.badge : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {s}
                <span className="ml-1.5 opacity-60">{sevCounts[s]}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Filtro de ferramenta + só com fix */}
      {activeTools.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => { setFilterTool('all'); resetPage() }}
            className={`px-3 py-1.5 rounded-lg text-xs font-code transition-all duration-150 cursor-pointer ${
              filterTool === 'all'
                ? 'bg-zinc-700/60 text-zinc-300 border border-zinc-600/60'
                : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            todas tools
          </button>
          {activeTools.map(t => (
            <button
              key={t}
              onClick={() => { setFilterTool(filterTool === t ? 'all' : t); resetPage() }}
              className={`px-3 py-1.5 rounded-lg text-xs font-code border transition-all duration-150 cursor-pointer ${
                filterTool === t
                  ? TOOL_FILTER_STYLE[t] ?? 'text-zinc-300 bg-zinc-700 border-zinc-600'
                  : 'bg-zinc-800/60 text-zinc-500 border-zinc-700/60 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {t}
              <span className="ml-1.5 opacity-60">{toolCounts[t]}</span>
            </button>
          ))}
          <button
            onClick={() => { setOnlyFixed(v => !v); resetPage() }}
            className={`px-3 py-1.5 rounded-lg text-xs font-code border transition-all duration-150 cursor-pointer ml-auto ${
              onlyFixed
                ? 'text-green-400 bg-green-500/15 border-green-500/40'
                : 'bg-zinc-800/60 text-zinc-500 border-zinc-700/60 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            só com fix
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-10 h-10 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-zinc-500 text-sm font-code">Nenhuma vulnerabilidade encontrada</p>
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-800/60">
          <span className="text-xs text-zinc-500 font-code">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
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
