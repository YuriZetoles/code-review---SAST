import { useNavigate } from 'react-router-dom'
import type { RankingEntry } from '../types.js'
import { ScoreBar } from './ScoreBar.js'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

interface RankingTableProps {
  entries: RankingEntry[]
}

export function RankingTable({ entries }: RankingTableProps) {
  const navigate = useNavigate()

  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        Aguardando submissões...
      </div>
    )
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
          <th className="pb-3 w-12">#</th>
          <th className="pb-3">Grupo</th>
          <th className="pb-3">Projeto</th>
          <th className="pb-3">Versão</th>
          <th className="pb-3 w-48">Score</th>
          <th className="pb-3 text-right">Enviado em</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(entry => (
          <tr
            key={entry.id}
            onClick={() => navigate(`/scan/${entry.id}`)}
            className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <td className="py-4 text-xl">{MEDALS[entry.rank] ?? entry.rank}</td>
            <td className="py-4 font-medium">{entry.group_name}</td>
            <td className="py-4 text-gray-300">{entry.project_name}</td>
            <td className="py-4 text-gray-500 font-mono text-sm">{entry.project_version}</td>
            <td className="py-4">
              <ScoreBar score={entry.score} />
            </td>
            <td className="py-4 text-right text-gray-500 text-sm">
              {new Date(entry.submitted_at).toLocaleTimeString('pt-BR')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
