import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { RankingTable } from '../components/RankingTable.js'
import type { RankingEntry } from '../types.js'

const POLL_INTERVAL = 10_000

export function RankingPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchRanking() {
      try {
        const data = await api.getRanking()
        if (mounted) {
          setEntries(data)
          setLastUpdate(new Date())
          setError(null)
        }
      } catch {
        if (mounted) setError('Erro ao carregar ranking')
      }
    }

    fetchRanking()
    const interval = setInterval(fetchRanking, POLL_INTERVAL)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Ranking ao vivo</h2>
        <span className="text-sm text-gray-500">
          🔄 Atualizado às {lastUpdate.toLocaleTimeString('pt-BR')}
        </span>
      </div>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <RankingTable entries={entries} />
    </div>
  )
}
