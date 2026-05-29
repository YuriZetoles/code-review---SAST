interface Step {
  number: number
  title: string
  description: string
  code?: string
  note?: string
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Instale o Docker',
    description: 'O scanner roda em container — única dependência necessária.',
    code: `# Linux (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Feche e reabra o terminal após este comando

# macOS / Windows → instale o Docker Desktop`,
    note: 'Se já tem Docker instalado, pule este passo.',
  },
  {
    number: 2,
    title: 'Execute o scanner',
    description: 'Entre na pasta do seu projeto e rode o comando abaixo. O Docker baixa a imagem automaticamente na primeira execução.',
    code: `cd /caminho/do/seu/projeto

docker run --rm \\
  -v "$(pwd):/scan" \\
  yurizetoles/sast-arena-scanner \\
  --group "Nome do Grupo" \\
  --name  "nome-do-projeto"`,
    note: 'A primeira execução baixa a imagem (~800 MB). As próximas são instantâneas.',
  },
  {
    number: 3,
    title: 'Acompanhe o ranking ao vivo',
    description: 'Após o envio, seu grupo aparece automaticamente no ranking em tempo real.',
    note: 'Pontuação começa em 100. Rode novamente depois de corrigir problemas para atualizar o score.',
  },
]

const SCORING = [
  { label: 'Critical', penalty: '−20 pts', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { label: 'High', penalty: '−10 pts', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { label: 'Medium', penalty: '−5 pts', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  { label: 'Low', penalty: '−1 pt', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { label: 'Secrets', penalty: '−15 pts', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { label: 'Misconfig', penalty: '−5–20 pts', color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
]

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-[#020617] border border-green-500/15 rounded-xl p-4 overflow-x-auto text-xs font-code text-green-300/80 leading-relaxed mt-3">
      {code}
    </pre>
  )
}

export function InstructionsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-code text-slate-100 mb-2">
          Como{' '}
          <span className="text-green-400 neon-text">usar</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Siga o passo a passo abaixo para rodar a análise de segurança no seu projeto
          e aparecer no ranking da oficina.
        </p>
      </div>

      <div className="space-y-6 mb-10">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="bg-slate-900/60 border border-green-500/15 rounded-2xl p-6 relative"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mt-0.5">
                <span className="text-sm font-bold font-code text-green-400">{step.number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-100 font-code mb-1">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                {step.code && <CodeBlock code={step.code} />}
                {step.note && (
                  <div className="flex items-start gap-2 mt-3">
                    <svg className="w-4 h-4 text-green-400/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-green-500/15 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold font-code text-slate-100 mb-4">
          Fórmula de pontuação
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {SCORING.map(s => (
            <div key={s.label} className={`rounded-xl px-4 py-3 border ${s.color}`}>
              <div className="text-xs font-code uppercase tracking-wide opacity-70 mb-1">{s.label}</div>
              <div className="text-base font-bold font-code">{s.penalty}</div>
            </div>
          ))}
        </div>
        <CodeBlock code={`score = 100
      - (critical  × 20)   ← CVEs críticos
      - (high      × 10)   ← CVEs altos / SAST high
      - (medium    ×  5)   ← CVEs médios / misconfigs médios
      - (low       ×  1)   ← CVEs baixos
      - (secrets   × 15)   ← secrets expostos (Gitleaks)
      - (misconfig × 5–20) ← IaC/Dockerfile mal configurado (Trivy)

score = max(score, 0)      ← nunca negativo
cap por ferramenta         ← nenhuma tool domina 100% do score`} />
        <p className="text-xs text-slate-600 mt-3">
          O grupo com maior score ao final da oficina vence.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-green-500/15 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold font-code text-slate-100 mb-4">
          O que o scanner analisa
        </h2>
        <div className="space-y-3">
          {[
            { tool: 'Grype', desc: 'CVEs em dependências — todas as severidades, sem exceções' },
            { tool: 'Semgrep', desc: 'Código-fonte — OWASP Top 10, CWE Top 25, secrets, transport inseguro, JWT, boas práticas' },
            { tool: 'Gitleaks', desc: 'Secrets e credenciais expostas no código e histórico git' },
            { tool: 'Trivy', desc: 'Misconfigurações em Dockerfiles, manifests Kubernetes e Terraform' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </div>
              <div>
                <span className="text-green-300/80 font-code text-sm font-semibold">{item.tool}</span>
                <span className="text-slate-400 text-sm ml-2">— {item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-red-500/15 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold font-code text-slate-100">Limpeza — remover tudo</h2>
        </div>
        <p className="text-slate-500 text-sm mb-4">
          Execute após a oficina para remover a imagem do scanner.
        </p>
        <CodeBlock code={`docker rmi yurizetoles/sast-arena-scanner`} />
        <div className="flex items-start gap-2 mt-3">
          <svg className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-slate-500">O Docker em si não é removido — apenas a imagem do scanner.</p>
        </div>
      </div>
    </div>
  )
}
