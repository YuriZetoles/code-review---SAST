import { useState } from 'react'

interface Step {
  number: number
  title: string
  description: string
  code?: string
  note?: string
  linkToRanking?: boolean
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Instale as ferramentas necessárias',
    description: 'Execute os comandos abaixo para instalar Syft, Grype, Semgrep, Gitleaks e jq no seu sistema.',
    code: `# Syft (SBOM)
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sudo sh -s -- -b /usr/local/bin

# Grype (CVEs)
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sudo sh -s -- -b /usr/local/bin

# Semgrep (SAST) — Ubuntu/Debian 23.04+
sudo apt install pipx -y && pipx install semgrep && pipx ensurepath
# Após instalar: feche e reabra o terminal (ou: source ~/.bashrc / source ~/.zshrc)

# Gitleaks (Secrets)
GITLEAKS_VER=$(curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | tr -d 'v')
curl -sSfL "https://github.com/gitleaks/gitleaks/releases/download/v\${GITLEAKS_VER}/gitleaks_\${GITLEAKS_VER}_linux_x64.tar.gz" \\
  | sudo tar -xz -C /usr/local/bin gitleaks

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
    linkToRanking: true,
  },
]

const SCORING = [
  { label: 'Critical', penalty: '−20 pts', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { label: 'High', penalty: '−10 pts', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { label: 'Medium', penalty: '−5 pts', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  { label: 'Low', penalty: '−1 pt', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { label: 'Secrets', penalty: '−15 pts', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { label: 'Unknown', penalty: '0 pts', color: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/60' },
]

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative mt-3 group/code">
      <pre className="bg-[#09090b] border border-white/10 rounded-xl p-4 overflow-x-auto text-xs font-code text-zinc-300 leading-relaxed pr-12">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-md border border-zinc-700/60 bg-zinc-800/80 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/25 transition-all duration-150 opacity-0 group-hover/code:opacity-100 focus:opacity-100"
        aria-label="Copiar código"
        title={copied ? 'Copiado!' : 'Copiar'}
      >
        {copied ? (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export function InstructionsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-code text-zinc-100 mb-2">
          Como{' '}
          <span className="text-white ">usar</span>
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Siga o passo a passo abaixo para rodar a análise de segurança no seu projeto
          e aparecer no ranking da oficina.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-6">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 relative"
          >
            {/* Step number */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mt-0.5">
                <span className="text-sm font-bold font-code text-white">{step.number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-100 font-code mb-1">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>

                {step.code && <CodeBlock code={step.code} />}

                {step.note && (
                  <div className="flex items-start gap-2 mt-3">
                    <svg className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-zinc-500 leading-relaxed">{step.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scoring formula */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-4">
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
        <p className="text-xs text-zinc-600 mt-3">
          O grupo com maior score ao final da oficina vence.
        </p>
      </div>

      {/* Cleanup */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-4">Limpeza — remover tudo</h2>
        <p className="text-zinc-500 text-sm mb-4">
          Execute após a oficina para remover todas as ferramentas instaladas.
        </p>
        <CodeBlock code={`# Syft e Grype
sudo rm -f /usr/local/bin/syft /usr/local/bin/grype

# Gitleaks
sudo rm -f /usr/local/bin/gitleaks

# Semgrep (via pipx)
pipx uninstall semgrep

# scan.sh baixado
rm -f scan.sh

# Arquivos temporários do scan (caso existam)
bash -c 'rm -f /tmp/sbom.*.json /tmp/grype.*.json /tmp/semgrep.*.json /tmp/gitleaks.*.json /tmp/payload.*.json 2>/dev/null; true'`} />
        <div className="flex items-start gap-2 mt-3">
          <svg className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-zinc-500">jq não é removido — é um utilitário comum que pode já existir no sistema.</p>
        </div>
      </div>

      {/* What the script does */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-4">
          O que o script faz
        </h2>
        <ul className="space-y-2 list-disc list-inside text-sm text-zinc-400">
          <li><span className="text-zinc-300 font-code font-semibold">Syft</span> — Gera SBOM (Software Bill of Materials) do projeto</li>
          <li><span className="text-zinc-300 font-code font-semibold">Grype</span> — Escaneia dependências em busca de CVEs conhecidos</li>
          <li><span className="text-zinc-300 font-code font-semibold">Semgrep</span> — Analisa o código estaticamente com regras de segurança</li>
          <li><span className="text-zinc-300 font-code font-semibold">Gitleaks</span> — Detecta secrets e credenciais expostas no código</li>
          <li><span className="text-zinc-300 font-code font-semibold">Envio automático</span> — resultados enviados ao servidor e score calculado</li>
        </ul>
      </div>

    </div>
  )
}
