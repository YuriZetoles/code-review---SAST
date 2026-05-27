import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api.js'
import { RankingTable } from '../components/RankingTable.js'
import type { RankingEntry } from '../types.js'

function useRelativeTime(date: Date) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return 'agora mesmo'
  if (secs < 60) return `há ${secs}s`
  const mins = Math.floor(secs / 60)
  return `há ${mins}min`
}

export function RankingPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  const relativeTime = useRelativeTime(lastUpdate)

  useEffect(() => {
    let fallbackInterval: ReturnType<typeof setInterval> | null = null
    let mounted = true

    function applyData(data: RankingEntry[]) {
      if (!mounted) return
      setEntries(data)
      setLastUpdate(new Date())
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
        // reconnect after 5s
        setTimeout(() => { if (mounted) connect() }, 5000)
      }
    }

    connect()

    return () => {
      mounted = false
      esRef.current?.close()
      if (fallbackInterval) clearInterval(fallbackInterval)
    }
  }, [])

  const topScore = entries[0]?.score ?? null
  const totalTeams = entries.length

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold font-code text-slate-100">
              Ranking{' '}
              <span className="text-green-400 neon-text">ao vivo</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Atualiza instantaneamente quando alguém envia um scan
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-code">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${connected ? 'bg-green-400 live-dot' : 'bg-yellow-500'}`} />
            <span className={connected ? 'text-slate-500' : 'text-yellow-500'}>
              {connected ? `atualizado ${relativeTime}` : `polling — ${relativeTime}`}
            </span>
          </div>
        </div>

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
              <div className="text-xs font-code text-slate-500 uppercase tracking-widest mb-1">Conexão</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full inline-block ${connected ? 'bg-green-400 live-dot' : 'bg-yellow-500'}`} />
                <span className={`text-sm font-code ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
                  {connected ? 'tempo real' : 'reconectando'}
                </span>
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
            <p className="text-slate-500 text-sm font-code">conectando...</p>
          </div>
        </div>
      ) : (
        <RankingTable entries={entries} />
      )}
    </div>
  )
}
