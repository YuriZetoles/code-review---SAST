import { useState } from 'react'

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

interface Tool {
  name: string
  role: string
  description: string
  color: string
}

const TOOLS: Tool[] = [
  {
    name: 'Syft',
    role: 'Geração de SBOM',
    description: 'Gera o Software Bill of Materials a partir do sistema de arquivos ou imagem de container, catalogando todos os pacotes e suas versões.',
    color: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/60',
  },
  {
    name: 'Grype',
    role: 'SCA / CVEs',
    description: 'Consome o SBOM gerado pelo Syft e cruza os pacotes com bases de dados de vulnerabilidades (NVD, GitHub Advisory, OSV) para identificar CVEs.',
    color: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/60',
  },
  {
    name: 'Semgrep',
    role: 'SAST',
    description: 'Analisa o código-fonte com regras semânticas baseadas em padrões AST. Cobre OWASP Top 10, CWE Top 25, boas práticas e regras customizáveis.',
    color: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/60',
  },
  {
    name: 'Gitleaks',
    role: 'Detecção de segredos',
    description: 'Varre o código e o histórico Git em busca de credenciais, tokens de API, chaves privadas e outros segredos expostos inadvertidamente.',
    color: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/60',
  },
  {
    name: 'jq',
    role: 'Processamento JSON',
    description: 'Processa e transforma as saídas JSON das ferramentas para normalização antes do envio à API.',
    color: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/60',
  },
  {
    name: 'curl',
    role: 'Envio HTTP',
    description: 'Realiza o POST dos resultados normalizados para a API central da plataforma.',
    color: 'text-zinc-300 border-zinc-700/60 bg-zinc-800/60',
  },
]

export function AboutPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-code text-zinc-100 mb-2">
          Sobre o{' '}
          <span className="text-white">SAST Arena</span>
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Documentação introdutória da oficina{' '}
          <span className="font-code text-zinc-300">Code Review &amp; SAST — Análise Estática de Segurança</span>.
        </p>
      </div>

      {/* Visão Geral */}
      <section aria-labelledby="visao-geral" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="visao-geral" className="text-lg font-bold font-code text-zinc-100 mb-3">Visão geral</h2>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            O SAST Arena é uma plataforma de análise estática de segurança projetada para
            oficinas práticas. Cada grupo de participantes executa um script local —{' '}
            <code className="font-code text-zinc-300 bg-zinc-800/70 px-1.5 py-0.5 rounded text-xs">scan.sh</code>{' '}
            — que orquestra quatro ferramentas open source em sequência: SCA via Syft e Grype,
            análise estática via Semgrep e detecção de segredos via Gitleaks.
          </p>
          <p>
            Os resultados são normalizados, pontuados por uma fórmula baseada em severidade e
            enviados automaticamente à API central. Um ranking ao vivo exibe os scores de todos
            os grupos em tempo real, estimulando a competição e a discussão sobre os achados.
          </p>
          <p>
            O objetivo é tornar tangível o impacto de vulnerabilidades reais: cada grupo
            analisa o próprio projeto, vê suas fragilidades no ranking e aprende a mitigá-las
            durante a discussão coletiva.
          </p>
        </div>
      </section>

      {/* Conceitos */}
      <section aria-labelledby="conceitos" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="conceitos" className="text-lg font-bold font-code text-zinc-100 mb-4">Conceitos</h2>
        <div className="space-y-5 text-sm text-zinc-400 leading-relaxed">
          <div>
            <h3 className="font-semibold font-code text-zinc-200 mb-1">Code Review</h3>
            <p>
              Revisão sistemática do código-fonte com o objetivo de identificar defeitos,
              violações de estilo e problemas de segurança antes da integração. Pode ser
              conduzida manualmente por pares ou automatizada por ferramentas integradas ao
              pipeline de CI/CD. Quando automatizada, é executada a cada pull request, impedindo
              que vulnerabilidades conhecidas avancem para o ambiente de produção (Ribeiro et al., 2024).
            </p>
          </div>
          <div>
            <h3 className="font-semibold font-code text-zinc-200 mb-1">SAST — Static Application Security Testing</h3>
            <p>
              Analisa o código-fonte, bytecode ou binários sem executar a aplicação. Identifica
              padrões inseguros como injeção de SQL, XSS e uso de algoritmos criptográficos
              fracos diretamente na estrutura sintática do código (Esquivel et al., 2024).
            </p>
          </div>
          <div>
            <h3 className="font-semibold font-code text-zinc-200 mb-1">SCA — Software Composition Analysis</h3>
            <p>
              Inventaria as dependências de terceiros de um projeto e cruza esse inventário com
              bases de dados de vulnerabilidades conhecidas, como o NVD (National Vulnerability
              Database). Complementa o SAST ao cobrir riscos introduzidos por bibliotecas
              externas, não pelo código próprio.
            </p>
          </div>
          <div>
            <h3 className="font-semibold font-code text-zinc-200 mb-1">Detecção de segredos</h3>
            <p>
              Varre o código e o histórico de commits em busca de credenciais hardcoded — tokens
              de API, chaves privadas, senhas e strings de conexão. Segredos expostos em
              repositórios representam um vetor de ataque direto, independentemente da
              severidade das demais vulnerabilidades (Taffarel; Freitas; Pereira Junior, 2024).
            </p>
          </div>
          <div>
            <h3 className="font-semibold font-code text-zinc-200 mb-1">CVE, NVD e SBOM</h3>
            <p>
              CVE (<em>Common Vulnerabilities and Exposures</em>) é o sistema de identificação
              padronizado de vulnerabilidades públicas. O NVD é a base mantida pelo NIST que
              enriquece os CVEs com pontuação CVSS, vetor de ataque e referências. O SBOM
              (<em>Software Bill of Materials</em>) é um inventário formal de todos os
              componentes de software de um sistema — é a base sobre a qual o SCA opera:
              sem um SBOM preciso, não é possível cruzar as dependências com o NVD de forma
              confiável (Ponce et al., 2024).
            </p>
          </div>
        </div>
      </section>

      {/* Ferramentas */}
      <section aria-labelledby="ferramentas" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="ferramentas" className="text-lg font-bold font-code text-zinc-100 mb-1">Ferramentas</h2>
        <p className="text-sm text-zinc-500 mb-4">Todas as ferramentas utilizadas são open source.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map(tool => (
            <div key={tool.name} className={`rounded-xl p-4 border ${tool.color}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-code font-semibold text-sm">{tool.name}</span>
                <span className="text-xs opacity-70 font-code">{tool.role}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{tool.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona o scan */}
      <section aria-labelledby="como-funciona" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="como-funciona" className="text-lg font-bold font-code text-zinc-100 mb-3">Como funciona o scan</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-2">
          O grupo executa o scanner a partir do diretório raiz do projeto a ser analisado. O CLI solicita as informações interativamente:
        </p>
        <CodeBlock code={`cd /caminho/do/seu/projeto

docker run --rm -it \\
  -v "$(pwd):/scan" \\
  yurizetoles/sast-arena-scanner`} />
        <p className="text-sm text-zinc-400 leading-relaxed mt-4 mb-3">
          Internamente, o script executa a seguinte sequência:
        </p>
        <ol className="space-y-2 text-sm text-zinc-400">
          {[
            ['Verificação de dependências', 'Confirma que Docker, jq e curl estão disponíveis no ambiente.'],
            ['Geração de SBOM com Syft', 'Cataloga todos os pacotes e dependências do projeto em formato SPDX/CycloneDX.'],
            ['Escaneamento de CVEs com Grype', 'Cruza o SBOM gerado com bases NVD, GitHub Advisory e OSV.'],
            ['Análise estática com Semgrep', 'Aplica regras OWASP Top 10, CWE Top 25 e detecção de secrets no código-fonte.'],
            ['Detecção de segredos com Gitleaks', 'Varre código e histórico Git em busca de credenciais expostas.'],
            ['Envio via POST /api/submissions', 'Os resultados normalizados são enviados à API central com curl.'],
            ['Exibição do score', 'O terminal exibe o score calculado e o grupo aparece no ranking ao vivo.'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-code text-xs text-white mt-0.5">{i + 1}</span>
              <span>
                <span className="font-code text-zinc-300 font-semibold">{title}</span>
                <span className="text-zinc-500"> — {desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Pontuação */}
      <section aria-labelledby="pontuacao" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="pontuacao" className="text-lg font-bold font-code text-zinc-100 mb-3">Pontuação</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
          O score de cada grupo parte de 100 pontos e é decrementado conforme os achados
          das ferramentas, ponderados pela severidade:
        </p>
        <CodeBlock code={`score = 100
      - (critical × 20)   ← CVEs críticos
      - (high     × 10)   ← CVEs altos / SAST high
      - (medium   ×  5)   ← CVEs médios
      - (low      ×  1)   ← CVEs baixos
      - (secrets  × 15)   ← segredos expostos (Gitleaks)

score = max(score, 0)      ← nunca negativo`} />
        <div className="mt-4 space-y-2 text-sm text-zinc-400 leading-relaxed">
          <p>
            Achados mais graves penalizam proporcionalmente mais: um único CVE crítico já remove
            20% do score máximo. Segredos expostos têm penalidade de 15 pontos cada — valor
            deliberadamente alto, pois credenciais vazadas representam risco imediato e
            independente de outras vulnerabilidades.
          </p>
          <p>O grupo com maior score ao final da oficina vence.</p>
        </div>
      </section>

      {/* Dinâmica da oficina */}
      <section aria-labelledby="dinamica" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="dinamica" className="text-lg font-bold font-code text-zinc-100 mb-4">Dinâmica da oficina</h2>
        <ol className="space-y-3 text-sm text-zinc-400">
          {[
            ['Apresentação dos conceitos', 'Introdução a Code Review, SAST, SCA, CVE/NVD e SBOM com exemplos reais de vulnerabilidades.'],
            ['Contextualização no pipeline CI/CD', 'Demonstração de como as ferramentas se integram a pipelines GitHub Actions, GitLab CI e similares.'],
            ['Distribuição do script para os grupos', 'Cada grupo recebe o script scan.sh e as credenciais de acesso à API central.'],
            ['Execução nos projetos', 'Os grupos rodam o scanner nos próprios projetos e os resultados aparecem no ranking ao vivo.'],
            ['Ranking ao vivo', 'O painel exibe scores em tempo real via SSE, criando um ambiente competitivo e engajador.'],
            ['Discussão dos achados', 'Análise coletiva das vulnerabilidades encontradas: o que são, por que ocorrem e como mitigar.'],
            ['Premiação do maior score', 'O grupo com maior pontuação é reconhecido; o foco da discussão final é o grupo com menor score — onde mais se aprende.'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-code text-xs text-white mt-0.5">{i + 1}</span>
              <span>
                <span className="font-code text-zinc-300 font-semibold">{title}</span>
                <span className="text-zinc-500"> — {desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Exemplos de vulnerabilidades */}
      <section aria-labelledby="exemplos" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="exemplos" className="text-lg font-bold font-code text-zinc-100 mb-4">Exemplos de vulnerabilidades</h2>
        <ul className="space-y-2 list-disc list-inside text-sm text-zinc-400">
          <li><span className="text-zinc-300 font-code font-semibold">SQL Injection no Moodle</span> — análise da plataforma Moodle com base no OWASP Top 10 identificou 894 alertas via OWASP ZAP, destacando SQL Injection como vulnerabilidade de maior impacto potencial (Quincozes et al., 2024).</li>
          <li><span className="text-zinc-300 font-code font-semibold">Cross-Site Script Inclusion (XSSI)</span> — estudo sobre XSSI demonstrou que a adoção do atributo <code className="font-code text-zinc-300 bg-zinc-800/70 px-1.5 py-0.5 rounded text-xs">SameSite</code> em cookies é a mitigação mais eficaz, com alta prevalência ainda em navegadores modernos (Miranda et al., 2024).</li>
          <li><span className="text-zinc-300 font-code font-semibold">Buckets de armazenamento em nuvem mal configurados</span> — a ferramenta GENBUCKET identificou automaticamente buckets AWS S3 e GCS publicamente acessíveis, expondo dados sensíveis por misconfigurações em políticas IAM (Bazé et al., 2025).</li>
          <li><span className="text-zinc-300 font-code font-semibold">Contratos inteligentes Solidity via AST</span> — a abordagem ASTSecurer analisa a árvore sintática abstrata de contratos Solidity para detectar reentrância, integer overflow e outras vulnerabilidades específicas de smart contracts (Esquivel et al., 2024).</li>
          <li><span className="text-zinc-300 font-code font-semibold">Web-fuzzing em roteadores Wi-Fi</span> — combinação de Semgrep e Nuclei em análise de larga escala de firmware de roteadores domésticos validou o <code className="font-code text-zinc-300 bg-zinc-800/70 px-1.5 py-0.5 rounded text-xs">CVE-2022-46552</code> e identificou padrões de vulnerabilidade recorrentes entre diferentes fabricantes (Taffarel; Freitas; Pereira Junior, 2024).</li>
        </ul>
      </section>

      {/* Referências */}
      <section aria-labelledby="referencias" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 id="referencias" className="text-lg font-bold font-code text-zinc-100 mb-1">Referências</h2>
        <p className="text-sm text-zinc-500 mb-4">ABNT NBR 6023</p>
        <ul className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <li>
            BAZÉ, M. et al. Identificação automática de buckets de armazenamento vulneráveis
            com GENBUCKET. In: <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA DA INFORMAÇÃO E DE SISTEMAS
            COMPUTACIONAIS (SBSeg)</em>, 2025. <em>Anais</em> [...]. Porto Alegre: SBC, 2025.
          </li>
          <li>
            ESQUIVEL, E. V. B. et al. Detecção de vulnerabilidades em contratos inteligentes
            utilizando árvore sintática abstrata. In: <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA DA
            INFORMAÇÃO E DE SISTEMAS COMPUTACIONAIS (SBSeg)</em>, 2024. <em>Anais</em> [...].
            Porto Alegre: SBC, 2024.
          </li>
          <li>
            MIRANDA, H. C. de et al. Cross-Site Script Inclusion: um estudo das estratégias de
            mitigação e atual prevalência da vulnerabilidade em navegadores. In:{' '}
            <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA DA INFORMAÇÃO E DE SISTEMAS COMPUTACIONAIS
            (SBSeg)</em>, 2024. <em>Anais</em> [...]. Porto Alegre: SBC, 2024.
          </li>
          <li>
            PONCE, L. M. et al. Identificação de serviços e dispositivos em dados de motores
            de busca para o enriquecimento de análise de vulnerabilidades. In:{' '}
            <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA DA INFORMAÇÃO E DE SISTEMAS COMPUTACIONAIS
            (SBSeg)</em>, 2024. <em>Anais</em> [...]. Porto Alegre: SBC, 2024.
          </li>
          <li>
            QUINCOZES, S. E. et al. Análise de vulnerabilidades da plataforma Moodle com base
            no Top 10 da OWASP. In: <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA DA INFORMAÇÃO E DE
            SISTEMAS COMPUTACIONAIS (SBSeg)</em>, 2024. <em>Anais</em> [...]. Porto Alegre:
            SBC, 2024.
          </li>
          <li>
            RIBEIRO, D. S. et al. Classificação de risco de vulnerabilidades de segurança via
            processos gaussianos e aprendizado ativo. In: <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA
            DA INFORMAÇÃO E DE SISTEMAS COMPUTACIONAIS (SBSeg)</em>, 2024. <em>Anais</em> [...].
            Porto Alegre: SBC, 2024.
          </li>
          <li>
            TAFFAREL, F.; FREITAS, O. B. de; PEREIRA JUNIOR, L. A. Análise de vulnerabilidades
            em larga escala nos roteadores Wi-Fi por meio de web-fuzzing. In:{' '}
            <em>SIMPÓSIO BRASILEIRO DE SEGURANÇA DA INFORMAÇÃO E DE SISTEMAS COMPUTACIONAIS
            (SBSeg)</em>, 2024. <em>Anais</em> [...]. Porto Alegre: SBC, 2024.
          </li>
        </ul>
      </section>
    </div>
  )
}
