import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { VulnList } from '../components/VulnList.js'
import { ScoreBar } from '../components/ScoreBar.js'
import type { SubmissionDetail, Vulnerability } from '../types.js'

type Tab = 'grype' | 'semgrep' | 'gitleaks'

export function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SubmissionDetail | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('grype')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getSubmission(id)
      .then(setDetail)
      .catch(() => setError('Submissão não encontrada'))
  }, [id])

  if (error) return <p className="text-red-400">{error}</p>
  if (!detail) return <p className="text-gray-500">Carregando...</p>

  const { submission, vulnerabilities } = detail
  const tabs: Tab[] = ['grype', 'semgrep', 'gitleaks']
  const tabLabels: Record<Tab, string> = {
    grype: '📦 SCA (Grype)',
    semgrep: '🔍 SAST (Semgrep)',
    gitleaks: '🔑 Secrets (Gitleaks)',
  }

  const vulnsForTab = vulnerabilities.filter((v: Vulnerability) => v.tool === activeTab)

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="text-cyan-400 hover:text-cyan-300 mb-6 text-sm"
      >
        ← Voltar ao ranking
      </button>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{submission.group_name}</h2>
            <p className="text-gray-400">
              {submission.project_name}
              <span className="ml-2 font-mono text-sm text-gray-600">@{submission.project_version}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-cyan-400">{submission.score}</div>
            <div className="text-gray-500 text-sm">/ 100</div>
          </div>
        </div>
        <ScoreBar score={submission.score} />
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === tab
                ? 'bg-cyan-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tabLabels[tab]}
            <span className="ml-2 text-xs opacity-60">
              ({vulnerabilities.filter((v: Vulnerability) => v.tool === tab).length})
            </span>
          </button>
        ))}
      </div>

      <VulnList vulns={vulnsForTab} />
    </div>
  )
}
