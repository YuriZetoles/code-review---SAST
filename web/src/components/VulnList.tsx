import { useState } from 'react'
import type { Vulnerability } from '../types.js'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/30',
  high: 'text-orange-400 bg-orange-900/30',
  medium: 'text-yellow-400 bg-yellow-900/30',
  low: 'text-blue-400 bg-blue-900/30',
  negligible: 'text-gray-400 bg-gray-800',
  unknown: 'text-gray-400 bg-gray-800',
}

interface VulnListProps {
  vulns: Vulnerability[]
}

export function VulnList({ vulns }: VulnListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const severities = ['all', 'critical', 'high', 'medium', 'low']
  const filtered = filter === 'all' ? vulns : vulns.filter(v => v.severity === filter)

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {severities.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filter === s ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-8">Nenhuma vulnerabilidade encontrada.</p>
      )}

      <div className="space-y-2">
        {filtered.map(v => (
          <div key={v.id} className="border border-gray-800 rounded overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === v.id ? null : v.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 text-left"
            >
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_COLORS[v.severity]}`}>
                {v.severity}
              </span>
              <span className="font-mono text-sm text-cyan-300">{v.vuln_id}</span>
              <span className="text-gray-400 text-sm ml-auto">{v.package}</span>
            </button>
            {expanded === v.id && (
              <div className="px-4 pb-4 pt-2 bg-gray-900 text-sm space-y-1">
                {v.location && <p className="text-gray-400">📍 {v.location}</p>}
                {v.description && <p className="text-gray-300">{v.description}</p>}
                {v.fix_available && (
                  <p className="text-green-400">✅ Fix disponível: {v.fix_available}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
