interface Section {
  id: string
  title: string
}

const NAV: Section[] = [
  { id: 'por-que', title: 'Por que segurança importa' },
  { id: 'sast', title: 'SAST' },
  { id: 'dast', title: 'DAST' },
  { id: 'sca', title: 'SCA' },
  { id: 'cve-cvss', title: 'CVE e CVSS' },
  { id: 'secrets', title: 'Secrets' },
  { id: 'iac', title: 'IaC Security' },
  { id: 'owasp', title: 'OWASP Top 10' },
  { id: 'ferramentas', title: 'Ferramentas' },
  { id: 'nossa-abordagem', title: 'Nossa abordagem' },
]

const OWASP = [
  { n: 'A01', label: 'Broken Access Control', desc: 'Usuário acessa recursos além do seu nível de permissão.' },
  { n: 'A02', label: 'Cryptographic Failures', desc: 'Dados sensíveis sem criptografia ou com algoritmos fracos (MD5, SHA1).' },
  { n: 'A03', label: 'Injection', desc: 'SQL, OS Command, LDAP injection via entrada não sanitizada.' },
  { n: 'A04', label: 'Insecure Design', desc: 'Falhas arquiteturais que não podem ser corrigidas só com código.' },
  { n: 'A05', label: 'Security Misconfiguration', desc: 'Configurações padrão inseguras, permissões excessivas, portas desnecessárias.' },
  { n: 'A06', label: 'Vulnerable Components', desc: 'Dependências com CVEs conhecidos e não atualizadas.' },
  { n: 'A07', label: 'Auth Failures', desc: 'Senhas fracas, sessões mal gerenciadas, ausência de MFA.' },
  { n: 'A08', label: 'Integrity Failures', desc: 'Atualizações e pipelines sem verificação de integridade.' },
  { n: 'A09', label: 'Logging Failures', desc: 'Ausência de logs e alertas adequados para detecção de ataques.' },
  { n: 'A10', label: 'SSRF', desc: 'Servidor faz requisições para destinos controlados pelo atacante.' },
]

const CVSS = [
  { range: '9.0 – 10.0', label: 'Critical', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { range: '7.0 – 8.9', label: 'High', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { range: '4.0 – 6.9', label: 'Medium', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  { range: '0.1 – 3.9', label: 'Low', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { range: '0.0', label: 'None', color: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/60' },
]

const TOOLS = [
  {
    name: 'Syft',
    vendor: 'Anchore',
    category: 'SBOM',
    desc: 'Gera o inventário completo de pacotes e dependências (Software Bill of Materials) a partir do sistema de arquivos ou imagem de container.',
  },
  {
    name: 'Grype',
    vendor: 'Anchore',
    category: 'SCA / CVEs',
    desc: 'Consome o SBOM do Syft e cruza os pacotes com bases NVD, GitHub Advisory e OSV para identificar CVEs por severidade.',
  },
  {
    name: 'Semgrep',
    vendor: 'Semgrep Inc.',
    category: 'SAST',
    desc: 'Analisa o código-fonte com regras semânticas baseadas em padrões AST. Cobre OWASP Top 10, CWE Top 25, secrets e boas práticas.',
  },
  {
    name: 'Gitleaks',
    vendor: 'Gitleaks',
    category: 'Secrets',
    desc: 'Varre código e histórico completo de commits em busca de tokens, chaves privadas, senhas e credenciais expostas inadvertidamente.',
  },
  {
    name: 'Trivy',
    vendor: 'Aqua Security',
    category: 'IaC / Misconfig',
    desc: 'Detecta misconfigurações em Dockerfiles, manifests Kubernetes e Terraform — containers rodando como root, portas desnecessárias, secrets em variáveis de ambiente.',
  },
]

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-code bg-zinc-800 border border-white/10 text-zinc-400 px-2 py-0.5 rounded-md">
      {label}
    </span>
  )
}

export function AboutPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-code text-zinc-100 mb-2">
          Sobre o{' '}
          <span className="text-white">SAST Arena</span>
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Fundamentos de segurança de software — do porquê ao como — contextualizando a plataforma{' '}
          <span className="font-code text-zinc-300">Code Review &amp; SAST</span>.
        </p>
      </div>

      {/* Índice */}
      <nav className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 mb-6">
        <p className="text-xs font-code text-zinc-500 uppercase tracking-widest mb-3">Conteúdo</p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {NAV.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sm font-code text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2"
              >
                <span className="text-zinc-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1. Por que segurança importa */}
      <section id="por-que" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-3">Por que segurança importa</h2>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            Toda aplicação é um conjunto de decisões de código. Cada decisão errada pode se tornar
            uma vulnerabilidade explorável. O custo de corrigir um problema cresce
            exponencialmente conforme avança no ciclo de desenvolvimento:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            {[
              { fase: 'Código', custo: 'Baixo', detalhe: 'Minutos. Correção local antes do commit.' },
              { fase: 'CI / Staging', custo: 'Médio', detalhe: 'Horas. Retrabalho, novo ciclo de testes.' },
              { fase: 'Produção', custo: 'Alto', detalhe: 'Incidentes, vazamentos, multas, reputação.' },
            ].map(f => (
              <div key={f.fase} className="rounded-xl border border-white/10 bg-zinc-800/40 p-4">
                <div className="font-code text-zinc-200 font-semibold text-sm mb-1">{f.fase}</div>
                <div className="text-xs text-zinc-500">{f.detalhe}</div>
              </div>
            ))}
          </div>
          <p>
            O modelo <span className="text-zinc-200 font-semibold">Shift Left</span> propõe mover
            a análise de segurança para o início do ciclo — integrada ao editor, ao pull request e
            ao pipeline de CI. Quanto mais cedo a vulnerabilidade é detectada, menor o custo e o
            impacto de corrigi-la.
          </p>
          <p>
            O conceito de <span className="text-zinc-200 font-semibold">DevSecOps</span> formaliza
            essa ideia: segurança deixa de ser uma etapa isolada no final do projeto e passa a ser
            responsabilidade contínua de todo o time de desenvolvimento.
          </p>
        </div>
      </section>

      {/* 2. SAST */}
      <section id="sast" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">SAST — Static Application Security Testing</h2>
        <p className="text-sm text-zinc-500 mb-4">Análise do código sem executar a aplicação</p>
        <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
          <p>
            O SAST analisa o código-fonte, bytecode ou binário <em>sem executar a aplicação</em>.
            O analisador lê o código como texto estruturado e procura padrões conhecidos de
            vulnerabilidade — injeção, criptografia fraca, configurações inseguras.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-code text-zinc-300 font-semibold mb-2 text-xs uppercase tracking-wide">O que encontra</p>
              <ul className="space-y-1 text-zinc-400">
                {[
                  'SQL Injection, Command Injection, Path Traversal',
                  'XSS — Cross-Site Scripting',
                  'Secrets e credenciais hardcoded',
                  'Algoritmos criptográficos fracos (MD5, SHA1)',
                  'Desserialização insegura',
                  'Misconfigurações em Dockerfile, K8s, Terraform',
                ].map(i => <li key={i} className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">+</span>{i}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-code text-zinc-300 font-semibold mb-2 text-xs uppercase tracking-wide">Vantagens</p>
              <ul className="space-y-1 text-zinc-400">
                {[
                  'Não precisa de ambiente rodando',
                  'Executa a cada commit no CI/CD',
                  'Cobre 100% do código analisado',
                  'Determinístico — mesmos resultados',
                ].map(i => <li key={i} className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">+</span>{i}</li>)}
              </ul>
              <p className="font-code text-zinc-300 font-semibold mb-2 mt-4 text-xs uppercase tracking-wide">Limitações</p>
              <ul className="space-y-1 text-zinc-400">
                {[
                  'Falsos positivos — triagem humana necessária',
                  'Não detecta falhas de lógica de negócio',
                  'Não vê comportamento em runtime',
                ].map(i => <li key={i} className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">x</span>{i}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DAST */}
      <section id="dast" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">DAST — Dynamic Application Security Testing</h2>
        <p className="text-sm text-zinc-500 mb-4">Teste da aplicação em execução, simulando um atacante</p>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          O DAST testa a aplicação <em>rodando</em> — envia requisições HTTP, payloads maliciosos
          e observa as respostas. Não precisa de acesso ao código-fonte, simula um atacante externo.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-code">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-wide border-b border-white/10">
                <th className="text-left py-2 pr-4">Critério</th>
                <th className="text-left py-2 pr-4">SAST</th>
                <th className="text-left py-2">DAST</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {[
                ['Aplicação precisa rodar?', 'Não', 'Sim'],
                ['Acesso ao código-fonte?', 'Sim', 'Não'],
                ['Falsos positivos', 'Alto', 'Baixo'],
                ['Cobertura de código', 'Alta', 'Baixa'],
                ['Velocidade', 'Rápido', 'Lento'],
                ['Ideal para', 'CI/CD, PR review', 'Staging, homologação'],
              ].map(([crit, sast, dast]) => (
                <tr key={crit} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-zinc-300">{crit}</td>
                  <td className="py-2 pr-4">{sast}</td>
                  <td className="py-2">{dast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-zinc-500 mt-4">
          Equipes maduras usam ambos em momentos diferentes do pipeline — SAST no commit, DAST no staging.
        </p>
      </section>

      {/* 4. SCA */}
      <section id="sca" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">SCA — Software Composition Analysis</h2>
        <p className="text-sm text-zinc-500 mb-4">Vulnerabilidades em dependências de terceiros</p>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            Aplicações modernas são compostas em sua maioria por código de terceiros — bibliotecas
            npm, pip, maven, cargo. Um projeto Node.js típico tem centenas de pacotes transitivos.
            Basta um deles ter uma vulnerabilidade crítica para comprometer toda a aplicação.
          </p>
          <p>
            O SCA inventaria essas dependências (via SBOM — <em>Software Bill of Materials</em>) e
            cruza com bases de CVEs conhecidos como NVD, GitHub Advisory e OSV.
          </p>
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="font-code text-red-400 font-semibold text-xs uppercase tracking-wide mb-2">Exemplo real — Log4Shell</p>
            <p className="text-zinc-400 text-sm">
              CVE-2021-44228 — biblioteca Java <span className="font-code text-zinc-300">log4j</span>{' '}
              presente em milhares de sistemas corporativos. Permitia execução remota de código
              via uma simples string de log. CVSS <span className="text-red-400 font-semibold">10.0 Critical</span>.
              Descoberta em dezembro de 2021, ainda é explorada ativamente.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CVE e CVSS */}
      <section id="cve-cvss" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-3">CVE e CVSS</h2>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed mb-5">
          <p>
            <span className="text-zinc-200 font-semibold">CVE</span> (<em>Common Vulnerabilities and
            Exposures</em>) é o identificador único para vulnerabilidades públicas conhecidas.
            Formato: <span className="font-code text-zinc-300">CVE-AAAA-NNNNN</span>.
          </p>
          <p>
            <span className="text-zinc-200 font-semibold">CVSS</span> (<em>Common Vulnerability
            Scoring System</em>) é a métrica de severidade de 0 a 10. Considera: acesso remoto,
            ausência de autenticação, impacto em confidencialidade, integridade e disponibilidade.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CVSS.map(c => (
            <div key={c.label} className={`rounded-xl px-4 py-3 border ${c.color}`}>
              <div className="text-xs font-code uppercase tracking-wide opacity-70 mb-1">{c.label}</div>
              <div className="text-sm font-bold font-code">{c.range}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Secrets */}
      <section id="secrets" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-3">Secrets e credenciais expostas</h2>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            Credenciais hardcoded — chaves de API, tokens de acesso, senhas, certificados privados
            — commitadas em repositórios são uma das vulnerabilidades mais críticas e frequentes.
          </p>
          <p>
            O problema vai além do código atual: o <span className="text-zinc-200 font-semibold">histórico
            completo de commits</span> é preservado pelo git. Mesmo que um secret seja removido em
            um commit posterior, ele continua acessível via <span className="font-code text-zinc-300">git log</span>.
            Repositórios que foram públicos no passado podem ter tido esse histórico indexado.
          </p>
          <div className="rounded-xl border border-white/10 bg-zinc-800/40 p-4 mt-2">
            <p className="text-xs font-code text-zinc-500 uppercase tracking-wide mb-2">O que ferramentas de detecção varrem</p>
            <ul className="space-y-1 text-zinc-400">
              {[
                'Código-fonte atual — todas as branches',
                'Histórico completo de commits',
                'Arquivos de configuração, .env, manifests',
                'Strings de alta entropia (prováveis chaves geradas)',
              ].map(i => <li key={i} className="flex items-start gap-2"><span className="text-zinc-600">&gt;</span>{i}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* 7. IaC Security */}
      <section id="iac" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">IaC Security — Segurança de Infraestrutura como Código</h2>
        <p className="text-sm text-zinc-500 mb-4">Misconfigurações em Dockerfiles, Kubernetes e Terraform</p>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            IaC (<em>Infrastructure as Code</em>) define infraestrutura via arquivos de configuração.
            Misconfigurações nesses arquivos geram vulnerabilidades em nível de infraestrutura —
            independentes do código da aplicação.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {[
              { arq: 'Dockerfile', exemplos: ['Container rodando como root (sem USER)', 'Imagem sem tag fixa (latest)', 'Secrets em ARG ou ENV'] },
              { arq: 'Kubernetes', exemplos: ['Pod sem limites de CPU/memória', 'Container com privileged: true', 'Secrets em variáveis de ambiente em texto plano'] },
            ].map(a => (
              <div key={a.arq} className="rounded-xl border border-white/10 bg-zinc-800/40 p-4">
                <p className="font-code text-zinc-300 font-semibold text-sm mb-2">{a.arq}</p>
                <ul className="space-y-1 text-zinc-400 text-sm">
                  {a.exemplos.map(e => <li key={e} className="flex items-start gap-2"><span className="text-zinc-600">!</span>{e}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. OWASP Top 10 */}
      <section id="owasp" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">OWASP Top 10</h2>
        <p className="text-sm text-zinc-500 mb-4">As dez categorias de vulnerabilidades web mais críticas</p>
        <div className="space-y-2">
          {OWASP.map(o => (
            <div key={o.n} className="flex items-start gap-3 rounded-xl border border-white/8 bg-zinc-800/30 px-4 py-3">
              <span className="flex-shrink-0 font-code text-xs text-zinc-500 mt-0.5 w-8">{o.n}</span>
              <div>
                <span className="font-code text-zinc-200 font-semibold text-sm">{o.label}</span>
                <span className="text-zinc-500 text-sm"> — {o.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Ferramentas */}
      <section id="ferramentas" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">Ferramentas utilizadas</h2>
        <p className="text-sm text-zinc-500 mb-4">Todas open source, cada uma especialista em sua categoria.</p>
        <div className="space-y-3">
          {TOOLS.map(t => (
            <div key={t.name} className="rounded-xl border border-white/10 bg-zinc-800/40 p-4">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <span className="font-code font-semibold text-zinc-100">{t.name}</span>
                <Tag label={t.category} />
                <span className="text-xs text-zinc-600 font-code">{t.vendor}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Nossa abordagem */}
      <section id="nossa-abordagem" className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold font-code text-zinc-100 mb-1">Nossa abordagem — hub de ferramentas open source</h2>
        <p className="text-sm text-zinc-500 mb-4">Uma ferramenta robusta construída sobre as melhores ferramentas de cada categoria</p>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            Em vez de uma ferramenta monolítica proprietária, a abordagem adotada orquestra as
            melhores ferramentas open source de cada categoria em um pipeline unificado — um hub
            que consolida resultados e calcula um score único e comparável.
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm font-code">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase tracking-wide border-b border-white/10">
                  <th className="text-left py-2 pr-6">Categoria</th>
                  <th className="text-left py-2 pr-6">Ferramenta</th>
                  <th className="text-left py-2">O que cobre</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {[
                  ['SBOM + SCA', 'Syft + Grype', 'Dependências e CVEs em pacotes de terceiros'],
                  ['SAST', 'Semgrep', 'Código-fonte — OWASP Top 10, CWE Top 25'],
                  ['Secrets', 'Gitleaks', 'Credenciais no código e histórico git'],
                  ['IaC / Misconfig', 'Trivy', 'Dockerfiles, Kubernetes, Terraform'],
                ].map(([cat, tool, cobre]) => (
                  <tr key={cat} className="border-b border-white/5">
                    <td className="py-2 pr-6 text-zinc-300">{cat}</td>
                    <td className="py-2 pr-6 text-zinc-200">{tool}</td>
                    <td className="py-2 text-zinc-500">{cobre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <p className="font-code text-zinc-300 font-semibold text-xs uppercase tracking-wide mb-2">Por que hub e não ferramenta única</p>
            <ul className="space-y-1.5 text-zinc-400">
              {[
                'Cada ferramenta é especialista em sua categoria — melhor cobertura combinada',
                'Todas open source — sem custo de licença, auditáveis, mantidas por comunidades ativas',
                'Combinadas, cobrem as principais categorias do OWASP Top 10',
                'Orquestração controlada — outputs normalizados e score único consolidado',
              ].map(i => <li key={i} className="flex items-start gap-2"><span className="text-zinc-600">+</span>{i}</li>)}
            </ul>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-800/40 p-4">
            <p className="font-code text-zinc-300 font-semibold text-xs uppercase tracking-wide mb-2">Pipeline de execução</p>
            <pre className="text-xs text-zinc-400 leading-relaxed overflow-x-auto">{`commit → CI/CD
          ├── build
          ├── testes unitários
          ├── SCA    (Syft + Grype)    ← CVEs em dependências
          ├── SAST   (Semgrep)         ← código-fonte
          ├── Secrets (Gitleaks)       ← credenciais expostas
          ├── IaC    (Trivy)           ← infraestrutura
          └── deploy  ← somente se aprovado`}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}
