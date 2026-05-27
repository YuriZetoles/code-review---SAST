import { useNavigate } from 'react-router-dom'
import type { RankingEntry } from '../types.js'
import { ScoreBar } from './ScoreBar.js'

interface RankingTableProps {
  entries: RankingEntry[]
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" aria-label="1º lugar">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    </div>
  )
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/50 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24" aria-label="2º lugar">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    </div>
  )
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-full bg-orange-700/20 border border-orange-700/50 flex items-center justify-center">
      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24" aria-label="3º lugar">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    </div>
  )
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <span className="text-sm font-code text-slate-500">{rank}</span>
    </div>
  )
}

function scoreTextColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function RankingTable({ entries }: RankingTableProps) {
  const navigate = useNavigate()

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-code text-sm">aguardando submissões</p>
          <p className="text-slate-600 text-xs mt-1">Execute o scan.sh no seu projeto para aparecer aqui</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-green-500/15">
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-slate-900/80 border-b border-green-500/15">
            <th className="px-4 py-3 text-left text-xs font-code text-slate-500 uppercase tracking-widest w-12">#</th>
            <th className="px-4 py-3 text-left text-xs font-code text-slate-500 uppercase tracking-widest">Grupo</th>
            <th className="px-4 py-3 text-left text-xs font-code text-slate-500 uppercase tracking-widest">Projeto</th>
            <th className="px-4 py-3 text-left text-xs font-code text-slate-500 uppercase tracking-widest hidden md:table-cell">Versão</th>
            <th className="px-4 py-3 text-left text-xs font-code text-slate-500 uppercase tracking-widest w-52">Score</th>
            <th className="px-4 py-3 text-right text-xs font-code text-slate-500 uppercase tracking-widest hidden sm:table-cell">Enviado</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.id}
              onClick={() => navigate(`/scan/${entry.id}`)}
              className={`
                border-b border-slate-800/60 cursor-pointer transition-all duration-200
                hover:bg-green-500/5 hover:border-green-500/20 group
                ${i === 0 ? 'bg-green-500/5' : 'bg-[#020617]'}
              `}
            >
              <td className="px-4 py-4">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="px-4 py-4">
                <span className={`font-semibold text-sm group-hover:text-green-400 transition-colors duration-200 ${i === 0 ? 'text-green-300' : 'text-slate-200'}`}>
                  {entry.group_name}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-slate-400 font-code">{entry.project_name}</span>
              </td>
              <td className="px-4 py-4 hidden md:table-cell">
                <span className="text-xs font-code text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {entry.project_version || '—'}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-base font-bold font-code tabular-nums w-8 ${scoreTextColor(entry.score)}`}>
                    {entry.score}
                  </span>
                  <ScoreBar score={entry.score} showLabel={false} />
                </div>
              </td>
              <td className="px-4 py-4 text-right hidden sm:table-cell">
                <span className="text-xs text-slate-600 font-code">
                  {new Date(entry.submitted_at).toLocaleTimeString('pt-BR')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
