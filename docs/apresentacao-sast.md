# Segurança de Software — SAST, DAST e o Ecossistema de Análise de Código

---

## 1. Por que segurança em código importa

Toda aplicação é um conjunto de decisões de código. Cada decisão errada pode se tornar uma vulnerabilidade explorável. O custo de corrigir um problema de segurança cresce exponencialmente conforme avança no ciclo de desenvolvimento:

- Na fase de código: barato (minutos de trabalho)
- Em produção: caro (incidentes, vazamentos, multas, reputação)

O modelo **Shift Left** propõe mover a análise de segurança para o início do ciclo — quanto mais cedo, menor o custo e o impacto.

---

## 2. O que é análise estática (SAST)

**SAST — Static Application Security Testing** é a análise do código-fonte, bytecode ou binário *sem executar a aplicação*. O analisador lê o código como texto estruturado e procura padrões conhecidos de vulnerabilidade.

### O que o SAST encontra

- Injeção de SQL, Command Injection, Path Traversal
- XSS (Cross-Site Scripting)
- Secrets e credenciais hardcoded no código
- Uso inseguro de criptografia (MD5, SHA1, chaves fracas)
- Desserialização insegura
- Importações e dependências vulneráveis
- Misconfigurações em Dockerfiles, manifests Kubernetes, Terraform

### O que o SAST *não* encontra

- Vulnerabilidades que só aparecem em tempo de execução
- Problemas de lógica de negócio complexa
- Falhas de autenticação que dependem do ambiente

### Vantagens

- Não precisa de ambiente rodando
- Pode ser executado no CI/CD a cada commit
- Cobre 100% do código analisado
- Determinístico — mesmos resultados a cada execução

---

## 3. O que é análise dinâmica (DAST)

**DAST — Dynamic Application Security Testing** testa a aplicação *em execução*, simulando um atacante externo. Envia requisições HTTP, payloads maliciosos e observa as respostas.

| Critério | SAST | DAST |
|---|---|---|
| Aplicação precisa rodar? | Não | Sim |
| Acesso ao código-fonte? | Sim | Não |
| Falsos positivos | Alto | Baixo |
| Cobertura de código | Alta | Baixa |
| Ideal para | CI/CD, revisão de código | Staging, testes de integração |

Na prática, equipes maduras usam ambos em momentos diferentes do pipeline.

---

## 4. SCA — Análise de Composição de Software

**SCA — Software Composition Analysis** foca nas *dependências* do projeto — bibliotecas de terceiros, pacotes npm/pip/maven/cargo. Verifica se alguma dependência possui CVEs (Common Vulnerabilities and Exposures) conhecidos.

### Por que isso importa

Aplicações modernas são compostas em sua maioria por código de terceiros. Um projeto Node.js típico tem centenas de pacotes transitivos. Basta um deles ter uma vulnerabilidade crítica para comprometer toda a aplicação.

**Exemplo real:** Log4Shell (CVE-2021-44228) — biblioteca Java presente em milhares de sistemas, permitia execução remota de código via string de log.

---

## 5. CVE, CVSS e severidades

**CVE — Common Vulnerabilities and Exposures** é um identificador único para vulnerabilidades conhecidas. Formato: `CVE-AAAA-NNNNN`.

**CVSS — Common Vulnerability Scoring System** é a métrica de severidade, de 0 a 10:

| Score | Severidade |
|---|---|
| 9.0 – 10.0 | Critical |
| 7.0 – 8.9 | High |
| 4.0 – 6.9 | Medium |
| 0.1 – 3.9 | Low |
| 0.0 | None |

O score considera vetores como: acesso remoto, ausência de autenticação, impacto em confidencialidade/integridade/disponibilidade.

---

## 6. Secrets e credenciais expostas

Uma categoria crítica de vulnerabilidade é a exposição de secrets no código — chaves de API, tokens, senhas, certificados privados commitados em repositórios. Mesmo que o repositório seja privado hoje, pode ter sido público no passado, e o histórico do git preserva tudo.

Ferramentas de detecção de secrets varrem:
- Código-fonte atual
- Histórico completo de commits
- Arquivos de configuração e .env

---

## 7. IaC Security — Misconfigurações de Infraestrutura

**IaC — Infrastructure as Code** define infraestrutura via arquivos de configuração (Dockerfiles, Kubernetes manifests, Terraform, Ansible). Misconfigurações nesses arquivos geram vulnerabilidades em nível de infraestrutura.

### Exemplos comuns

- Container rodando como `root` (sem `USER` no Dockerfile)
- Imagem sem tag fixa (`latest`) — atualizações não controladas
- Portas desnecessárias expostas
- Ausência de limites de recursos (`resources.limits`)
- Variáveis de ambiente com secrets em texto plano no manifest

---

## 8. Ferramentas consolidadas do mercado

### Análise de dependências (SCA)

**Grype** (Anchore) — scanner de CVEs em SBOMs e imagens Docker. Usa base de dados atualizada diariamente. Open source.

**Syft** (Anchore) — gerador de SBOM (Software Bill of Materials). Lista todos os pacotes e versões de uma aplicação ou imagem. Integra com Grype.

**OWASP Dependency-Check** — histórico, amplamente usado em Java/Maven.

### Análise estática (SAST)

**Semgrep** — motor de análise estática baseado em padrões (regras). Suporta dezenas de linguagens. Possui conjunto extenso de regras para OWASP Top 10, CWE Top 25, secrets, práticas inseguras. Open source com plano pago para regras proprietárias.

**SonarQube** — plataforma enterprise para qualidade e segurança de código. Amplamente adotado em pipelines corporativos.

**CodeQL** (GitHub) — análise semântica profunda. Usado pelo GitHub Advanced Security.

### Detecção de secrets

**Gitleaks** — varre repositórios git (código atual e histórico) em busca de secrets. Baseado em expressões regulares e entropia. Amplamente usado em pipelines CI.

**TruffleHog** — alternativa ao Gitleaks, com ênfase em histórico profundo.

**detect-secrets** (Yelp) — focado em prevenção durante o desenvolvimento.

### IaC / Misconfigurações

**Trivy** (Aqua Security) — scanner multifuncional: CVEs em dependências, imagens Docker, IaC (Kubernetes, Terraform, Dockerfile). Uma das ferramentas mais completas e ativas da categoria.

**Checkov** — especializado em IaC, suporta Terraform, CloudFormation, Kubernetes, Helm.

**kube-bench** — verifica conformidade de clusters Kubernetes com o CIS Benchmark.

---

## 9. Integração em pipelines CI/CD

Ferramentas de análise estática são mais eficazes quando integradas ao pipeline de CI/CD, executando a cada pull request ou commit. O resultado bloqueia o merge se vulnerabilidades críticas forem encontradas.

```
commit → CI pipeline
            ├── build
            ├── testes unitários
            ├── SAST (Semgrep, CodeQL)
            ├── SCA (Grype, Dependency-Check)
            ├── Secrets scan (Gitleaks)
            ├── IaC scan (Trivy, Checkov)
            └── deploy (somente se tudo passou)
```

Esse modelo é chamado de **DevSecOps** — integração de segurança no fluxo de desenvolvimento, não como etapa separada ao final.

---

## 10. OWASP Top 10 — as vulnerabilidades mais comuns

O **OWASP Top 10** é a lista das dez categorias de vulnerabilidades web mais críticas, atualizada periodicamente pela Open Web Application Security Project:

1. **Broken Access Control** — usuário acessa recursos além do seu nível de permissão
2. **Cryptographic Failures** — dados sensíveis sem criptografia ou com algoritmos fracos
3. **Injection** — SQL, OS Command, LDAP injection via entrada não sanitizada
4. **Insecure Design** — falhas arquiteturais que não podem ser corrigidas só com código
5. **Security Misconfiguration** — configurações padrão inseguras, permissões excessivas
6. **Vulnerable and Outdated Components** — dependências com CVEs conhecidos
7. **Identification and Authentication Failures** — senhas fracas, sessões mal gerenciadas
8. **Software and Data Integrity Failures** — atualizações e pipelines sem verificação de integridade
9. **Security Logging and Monitoring Failures** — ausência de logs e alertas adequados
10. **Server-Side Request Forgery (SSRF)** — servidor faz requisições para destinos controlados pelo atacante

---

## 11. Nossa abordagem — hub de ferramentas open source

Em vez de uma única ferramenta monolítica, a abordagem adotada é orquestrar as melhores ferramentas open source de cada categoria em um pipeline unificado:

| Categoria | Ferramenta | O que cobre |
|---|---|---|
| SBOM + SCA | Syft + Grype | Dependências e CVEs |
| SAST | Semgrep | Código-fonte, OWASP Top 10, CWE Top 25 |
| Secrets | Gitleaks | Credenciais expostas no código e histórico git |
| IaC/Misconfig | Trivy | Dockerfiles, Kubernetes, Terraform |

### Por que hub e não ferramenta única

- Cada ferramenta é especialista em sua categoria — melhor cobertura
- Todas são open source — sem custo de licença, auditáveis
- Mantidas por comunidades ativas (Anchore, Semgrep, Aqua Security)
- Combinadas, cobrem as principais categorias do OWASP Top 10
- A orquestração é controlada — outputs normalizados e consolidados

### O que o hub entrega

Um score único de segurança calculado sobre os resultados consolidados de todas as ferramentas, permitindo comparação objetiva entre projetos e rastreamento de evolução ao longo do tempo.

---

## 12. Limitações e boas práticas

- SAST gera falsos positivos — toda saída precisa ser triada por um humano
- Nenhuma ferramenta cobre tudo — combinação é necessária
- Análise estática não substitui revisão de código manual para lógica complexa
- Resultados sem ação não têm valor — o pipeline precisa de responsáveis
- Segurança é processo contínuo, não evento único
