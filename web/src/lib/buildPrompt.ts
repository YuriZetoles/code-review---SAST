import type { SubmissionDetail, Vulnerability } from '../types.js'

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'negligible', 'unknown']

const TOOL_SECTIONS: { tool: Vulnerability['tool']; title: string; scope: string; guidance: string }[] = [
  {
    tool: 'grype',
    title: 'SCA — Grype (vulnerabilidades em dependências)',
    scope: 'CVEs conhecidos em dependências do projeto (package.json, requirements.txt, go.mod, etc.).',
    guidance: 'Atualize cada pacote para a versão corrigida indicada em "fix". Se não houver fix, avalie substituir a dependência ou aplicar mitigação.',
  },
  {
    tool: 'semgrep',
    title: 'SAST — Semgrep (vulnerabilidades no código-fonte)',
    scope: 'Padrões inseguros detectados por análise estática do código-fonte.',
    guidance: 'Corrija o código no arquivo/linha indicado em "local". A regra (id) descreve o padrão inseguro detectado.',
  },
  {
    tool: 'gitleaks',
    title: 'Secrets — Gitleaks (credenciais expostas)',
    scope: 'Credenciais, tokens e chaves expostos no código ou histórico do repositório.',
    guidance: 'Remova o secret do código, revogue/rotacione a credencial exposta e mova para variável de ambiente ou secret manager. Remover apenas do código não basta se já foi commitado.',
  },
  {
    tool: 'trivy',
    title: 'IaC — Trivy (misconfigurations de infraestrutura)',
    scope: 'Configurações inseguras em Dockerfiles, manifests Kubernetes, Terraform e similares.',
    guidance: 'Ajuste o arquivo de configuração indicado em "local" seguindo a descrição da misconfiguration.',
  },
]

function formatVuln(v: Vulnerability): string {
  const lines = [`- [${v.severity.toUpperCase()}] ${v.vuln_id}`]
  if (v.package) lines.push(`  - pacote/alvo: ${v.package}`)
  if (v.location) lines.push(`  - local: ${v.location}`)
  if (v.description) lines.push(`  - descrição: ${v.description}`)
  if (v.fix_available) lines.push(`  - fix: ${v.fix_available}`)
  return lines.join('\n')
}

function sortBySeverity(vulns: Vulnerability[]): Vulnerability[] {
  return vulns
    .slice()
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
}

export function buildPrompt(detail: SubmissionDetail): string {
  const { submission, vulnerabilities } = detail

  const toolVersions = [
    submission.grype_version && `Grype ${submission.grype_version}`,
    submission.semgrep_version && `Semgrep ${submission.semgrep_version}`,
    submission.gitleaks_version && `Gitleaks ${submission.gitleaks_version}`,
    submission.trivy_version && `Trivy ${submission.trivy_version}`,
  ].filter(Boolean).join(', ')

  const parts: string[] = [
    '# Correção de vulnerabilidades — relatório de análise de segurança',
    '',
    'Você é um agente de correção de segurança. O projeto abaixo foi analisado por quatro ferramentas (Grype, Semgrep, Gitleaks e Trivy) e as vulnerabilidades encontradas estão listadas por ferramenta. Corrija cada uma delas no código do projeto.',
    '',
    '## Contexto do projeto',
    '',
    `- Projeto: ${submission.project_name}${submission.project_version ? ` (versão ${submission.project_version})` : ''}`,
    `- Grupo: ${submission.group_name}`,
    `- Score atual: ${submission.score}/100`,
    `- Total de achados: ${vulnerabilities.length}`,
  ]
  if (toolVersions) parts.push(`- Ferramentas: ${toolVersions}`)

  parts.push(
    '',
    '## Instruções gerais',
    '',
    '1. Trate os achados em ordem de severidade: critical → high → medium → low.',
    '2. Para cada correção, preserve o comportamento funcional do código.',
    '3. Não suprima alertas com comentários de ignore (nosemgrep, trivy:ignore, etc.) — corrija a causa raiz.',
    '4. Ao final, liste as correções aplicadas e qualquer achado que não pôde ser corrigido, com justificativa.',
  )

  for (const section of TOOL_SECTIONS) {
    const vulns = sortBySeverity(vulnerabilities.filter(v => v.tool === section.tool))
    parts.push('', `## ${section.title}`, '', section.scope)
    if (vulns.length === 0) {
      parts.push('', 'Nenhum achado.')
      continue
    }
    parts.push(`Como corrigir: ${section.guidance}`, '', `Achados (${vulns.length}):`, '')
    parts.push(...vulns.map(formatVuln))
  }

  return parts.join('\n')
}
