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
    title: 'Instale as ferramentas necessárias',
    description: 'Execute os comandos abaixo para instalar Syft, Grype, Semgrep, Gitleaks e jq no seu sistema.',
    code: `# Syft (SBOM)
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Grype (CVEs)
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Semgrep (SAST)
pip install semgrep

# Gitleaks (Secrets)
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz \\
  | tar -xz -C /usr/local/bin

# jq (processamento JSON)
sudo apt install jq   # ou: brew install jq`,
  },
  {
    number: 2,
    title: 'Baixe o script de scan',
    description: 'Faça o download do script scan.sh diretamente do servidor.',
    code: `curl -O http://codereview.yuriprojects.dpdns.org/scan.sh
chmod +x scan.sh`,
    note: 'Você também pode copiar o script manualmente do instrutor.',
  },
  {
    number: 3,
    title: 'Execute o scan no seu projeto',
    description: 'Rode o script apontando para o diretório do seu projeto. Substitua os valores entre aspas.',
    code: `./scan.sh \\
  --group    "Nome do Grupo" \\
  --name     "nome-do-projeto" \\
  --path     ./caminho/do/projeto \\
  --api-url  http://codereview.yuriprojects.dpdns.org`,
    note: 'O scan pode levar de 1 a 5 minutos dependendo do tamanho do projeto.',
  },
  {
    number: 4,
    title: 'Acompanhe o ranking ao vivo',
    description: 'Após o envio, seu grupo aparecerá automaticamente no ranking. A pontuação é atualizada a cada 10 segundos.',
    note: 'Pontuação começa em 100. Cada vulnerabilidade encontrada reduz a pontuação.',
  },
]

const SCORING = [
  { label: 'Critical', penalty: '−20 pts', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { label: 'High', penalty: '−10 pts', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { label: 'Medium', penalty: '−5 pts', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  { label: 'Low', penalty: '−1 pt', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { label: 'Secrets', penalty: '−15 pts', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
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
    <div className="max-w-3xl">
      {/* Header */}
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

      {/* Steps */}
      <div className="space-y-6 mb-10">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="bg-slate-900/60 border border-green-500/15 rounded-2xl p-6 relative"
          >
            {/* Step number */}
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

      {/* Scoring formula */}
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
      - (critical × 20)
      - (high     × 10)
      - (medium   ×  5)
      - (low      ×  1)
      - (secrets  × 15)   ← findings do Gitleaks

score = max(score, 0)     ← nunca negativo`} />
        <p className="text-xs text-slate-600 mt-3">
          O grupo com maior score ao final da oficina vence.
        </p>
      </div>

      {/* What the script does */}
      <div className="bg-slate-900/60 border border-green-500/15 rounded-2xl p-6">
        <h2 className="text-lg font-bold font-code text-slate-100 mb-4">
          O que o script faz
        </h2>
        <div className="space-y-3">
          {[
            { tool: 'Syft', desc: 'Gera SBOM (Software Bill of Materials) do projeto' },
            { tool: 'Grype', desc: 'Escaneia dependências em busca de CVEs conhecidos' },
            { tool: 'Semgrep', desc: 'Analisa o código estaticamente com regras de segurança' },
            { tool: 'Gitleaks', desc: 'Detecta secrets e credenciais expostas no código' },
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
          <div className="border-t border-slate-800/60 pt-3 mt-1">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <span className="text-slate-300 font-code text-sm font-semibold">Envio automático</span>
                <span className="text-slate-500 text-sm ml-2">— resultados enviados ao servidor e score calculado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
