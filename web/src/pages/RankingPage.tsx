import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { RankingTable } from '../components/RankingTable.js'
import type { RankingEntry } from '../types.js'

const POLL_INTERVAL = 10_000

export function RankingPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchRanking() {
      try {
        const data = await api.getRanking()
        if (mounted) {
          setEntries(data)
          setLastUpdate(new Date())
          setError(null)
          setLoading(false)
        }
      } catch {
        if (mounted) {
          setError('Erro ao carregar ranking')
          setLoading(false)
        }
      }
    }

    fetchRanking()
    const interval = setInterval(fetchRanking, POLL_INTERVAL)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const topScore = entries[0]?.score ?? null
  const totalTeams = entries.length

  return (
    <div>
      {/* Hero section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold font-code text-slate-100">
              Ranking{' '}
              <span className="text-green-400 neon-text">ao vivo</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Atualizado automaticamente a cada {POLL_INTERVAL / 1000}s
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-code">
            <svg className="w-3.5 h-3.5 text-green-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        </div>

        {/* Stats row */}
        {totalTeams > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-900/60 border border-green-500/15 rounded-xl px-4 py-3">
              <div className="text-xs font-code text-slate-500 uppercase tracking-widest mb-1">Grupos</div>
              <div className="text-2xl font-bold font-code text-green-400">{totalTeams}</div>
            </div>
            {topScore !== null && (
              <div className="bg-slate-900/60 border border-green-500/15 rounded-xl px-4 py-3">
                <div className="text-xs font-code text-slate-500 uppercase tracking-widest mb-1">Top score</div>
                <div className="text-2xl font-bold font-code text-green-400">{topScore}</div>
              </div>
            )}
            <div className="bg-slate-900/60 border border-green-500/15 rounded-xl px-4 py-3 hidden sm:block">
              <div className="text-xs font-code text-slate-500 uppercase tracking-widest mb-1">Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-400 live-dot inline-block" />
                <span className="text-sm font-code text-green-400">online</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm font-code">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-code">carregando ranking...</p>
          </div>
        </div>
      ) : (
        <RankingTable entries={entries} />
      )}
    </div>
  )
}
