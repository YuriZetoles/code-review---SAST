import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api.js'
import { RankingTable } from '../components/RankingTable.js'
import type { RankingEntry } from '../types.js'

export function RankingPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [now, setNow] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    let fallbackInterval: ReturnType<typeof setInterval> | null = null
    let mounted = true

    function applyData(data: RankingEntry[]) {
      if (!mounted) return
      setEntries(data)
      setError(null)
      setLoading(false)
    }

    function startFallbackPolling() {
      if (fallbackInterval) return
      fallbackInterval = setInterval(async () => {
        try {
          const data = await api.getRanking()
          applyData(data)
        } catch {
          if (mounted) setError('Erro ao carregar ranking')
        }
      }, 3000)
    }

    function connect() {
      const es = new EventSource('/api/ranking/stream')
      esRef.current = es

      es.onopen = () => {
        if (!mounted) return
        setConnected(true)
        setError(null)
        if (fallbackInterval) {
          clearInterval(fallbackInterval)
          fallbackInterval = null
        }
      }

      es.onmessage = (e) => {
        try {
          applyData(JSON.parse(e.data) as RankingEntry[])
        } catch { /* ignore parse errors */ }
      }

      es.onerror = () => {
        if (!mounted) return
        setConnected(false)
        es.close()
        startFallbackPolling()
        setTimeout(() => { if (mounted) connect() }, 5000)
      }
    }

    connect()
    const clockInterval = setInterval(() => setNow(new Date()), 1000)

    return () => {
      mounted = false
      esRef.current?.close()
      if (fallbackInterval) clearInterval(fallbackInterval)
      clearInterval(clockInterval)
    }
  }, [])

  const topScore = entries[0]?.score ?? null
  const totalTeams = entries.length
  const avgScore = totalTeams > 0 ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / totalTeams) : null
  const minScore = totalTeams > 0 ? entries[entries.length - 1].score : null

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold font-code text-zinc-100">
              Ranking{' '}
              <span className="text-white">ao vivo</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Atualiza instantaneamente quando alguém envia um scan
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-code">
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {now.toLocaleTimeString('pt-BR')}
          </div>
        </div>

        {totalTeams > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {topScore !== null && (
              <div className="bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3">
                <div className="text-xs font-code text-zinc-500 uppercase tracking-widest mb-1">Top score</div>
                <div className="text-2xl font-bold font-code text-white">{topScore}</div>
              </div>
            )}
            {minScore !== null && (
              <div className="bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3">
                <div className="text-xs font-code text-zinc-500 uppercase tracking-widest mb-1">Menor score</div>
                <div className="text-2xl font-bold font-code text-white">{minScore}</div>
              </div>
            )}
            {avgScore !== null && (
              <div className="bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 hidden sm:block">
                <div className="text-xs font-code text-zinc-500 uppercase tracking-widest mb-1">Média</div>
                <div className="text-2xl font-bold font-code text-white">{avgScore}</div>
              </div>
            )}
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 hidden sm:block">
              <div className="text-xs font-code text-zinc-500 uppercase tracking-widest mb-1">Grupos</div>
              <div className="text-2xl font-bold font-code text-white">{totalTeams}</div>
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
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm font-code">Conectando...</p>
          </div>
        </div>
      ) : (
        <RankingTable entries={entries} />
      )}
    </div>
  )
}
