# Planejamento — Code Review & SAST: Análise Estática de Segurança

**Disciplina:** Tópicos Especiais  
**Tema:** Code Review & SAST — Análise Estática de Segurança  
**Data:** 2026-05-21  

---

## Visão Geral

Oficina prática onde cada grupo executa um script de análise de segurança em seu projeto da fábrica. Os resultados são enviados automaticamente a um sistema web que normaliza, pontua e exibe um ranking em tempo real. O melhor projeto é premiado.

**Cobertura de análise (nível C):**
- SCA — Software Composition Analysis (Syft + Grype → CVEs em dependências)
- SAST — Static Application Security Testing (Semgrep → vulnerabilidades no código-fonte)
- Secrets Detection (Gitleaks → credenciais e segredos expostos)

---

## Arquitetura Geral

```
┌─────────────────────────────────────────┐
│  GRUPO (local)                          │
│                                         │
│  scan.sh --group "G1"                   │
│           --project-name "meu-app"      │
│           --project-path ./             │
│           --api-url https://sast.vm     │
│                                         │
│  Syft → SBOM → Grype  ─┐               │
│  Semgrep               ─┼→ raw JSON     │
│  Gitleaks              ─┘    │          │
│                              │ POST     │
└──────────────────────────────┼──────────┘
                               ▼
┌─────────────────────────────────────────┐
│  API  (Fastify + TypeScript)            │
│                                         │
│  POST /api/submissions                  │
│    └─ normaliza → calcula score         │
│       → persiste no PostgreSQL          │
│                                         │
│  GET  /api/ranking                      │
│  GET  /api/submissions/:id              │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  PostgreSQL (Drizzle)│
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Frontend           │
        │  React + Vite + TS  │
        │                     │
        │  /          ranking  │
        │  /scan/:id  detalhe  │
        └─────────────────────┘
```

**Princípio de design:** script envia dados brutos → API normaliza e calcula score centralmente → scoring ajustável sem redistribuir script.

---

## Script (`scan.sh`)

### Interface

```bash
./scan.sh \
  --group    "Grupo 1" \
  --name     "meu-app" \
  --path     ./          \
  --api-url  https://sast.minhavm.com
```

### Fluxo interno

1. Verificar dependências: `syft`, `grype`, `semgrep`, `gitleaks`, `jq`, `curl`
2. Atualizar DB do Grype
3. Detectar versão do projeto via `git rev-parse --short HEAD`
4. Detectar versões das ferramentas
5. Gerar SBOM com Syft
6. Escanear CVEs com Grype (`-o json`)
7. Escanear código com Semgrep (`--json`, regras: `p/security-audit`)
8. Detectar secrets com Gitleaks (`detect --report-format json`)
9. Montar payload JSON consolidado
10. `curl -X POST` ao endpoint da API
11. Exibir score e breakdown retornados pela API

### Payload enviado

```json
{
  "group_name": "Grupo 1",
  "project_name": "meu-app",
  "project_version": "abc1234",
  "tool_versions": {
    "syft": "1.x.x",
    "grype": "0.79.x",
    "semgrep": "1.72.x",
    "gitleaks": "8.18.x"
  },
  "grype":    { /* saída bruta grype -o json */ },
  "semgrep":  { /* saída bruta semgrep --json */ },
  "gitleaks": { /* saída bruta gitleaks --report-format json */ }
}
```

---

## API (Fastify + TypeScript + Drizzle + PostgreSQL)

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/submissions` | Recebe scan bruto, normaliza, pontua, persiste → `201 { id, score, breakdown }` |
| `GET`  | `/api/ranking` | Lista ordenada por score → `200 [{ rank, group_name, project_name, score, breakdown, submitted_at }]` |
| `GET`  | `/api/submissions/:id` | Detalhe completo de uma submission → `200 { submission, vulnerabilities[] }` |
| `GET`  | `/api/submissions/:id/vulnerabilities` | Vulnerabilidades filtráveis por `?tool=grype&severity=critical` |

### Serviços internos

- **`normalizer.ts`** — parseia saídas brutas de cada ferramenta → array uniforme de `Vulnerability`
- **`scorer.ts`** — aplica fórmula de penalidade → retorna score + breakdown por categoria

---

## Schema do Banco (Drizzle + PostgreSQL)

```
submissions
├── id                uuid        PK
├── group_name        varchar(100)
├── project_name      varchar(200)
├── project_version   varchar(50)   -- git short SHA
├── submitted_at      timestamp
├── score             integer       -- 0-100
├── grype_version     varchar(50)
├── semgrep_version   varchar(50)
├── gitleaks_version  varchar(50)
└── raw_report        jsonb         -- payload completo arquivado

vulnerabilities
├── id              uuid        PK
├── submission_id   uuid        FK → submissions.id
├── tool            enum        ('grype', 'semgrep', 'gitleaks')
├── severity        enum        ('critical', 'high', 'medium', 'low', 'negligible', 'unknown')
├── vuln_id         varchar(100)  -- CVE-ID / semgrep rule / secret type
├── package         varchar(200)  -- pacote ou arquivo afetado
├── location        varchar(500)  -- arquivo:linha (semgrep/gitleaks)
├── description     text
└── fix_available   varchar(100)  -- versão de fix ou null
```

---

## Fórmula de Pontuação

```
score = 100
      - (n_critical   × 20)
      - (n_high       × 10)
      - (n_medium     ×  5)
      - (n_low        ×  1)
      - (n_secrets    × 15)   ← gitleaks findings (severidade fixa "high")
score = max(score, 0)
```

Mapeamento Semgrep → severidade:
- `ERROR` → high
- `WARNING` → medium
- `INFO` → low

---

## Frontend (React + Vite + TypeScript + shadcn/ui + Tailwind)

### Páginas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | `RankingPage` | Ranking ao vivo, polling 10s |
| `/scan/:id` | `DetailPage` | Drill-down por projeto, tabs por ferramenta |

### RankingPage

- Tabela com posição (🥇🥈🥉), grupo, projeto, score, breakdown de contagens por severidade
- Barra de score colorida: verde ≥80, amarelo ≥50, vermelho <50
- Polling `GET /api/ranking` a cada 10s com animação de transição no score
- Clique na linha → `DetailPage`

### DetailPage

- Header: grupo, projeto, git SHA, score
- Tabs: SCA (Grype) / SAST (Semgrep) / Secrets (Gitleaks)
- Filtro por severidade
- Cada linha expansível: descrição + link CVE / regra Semgrep

### Componentes

- `RankingTable` — tabela principal
- `ScoreBar` — barra colorida de progresso
- `VulnList` — lista filtrável de vulnerabilidades
- `VulnRow` — linha expansível com detalhes

---

## Estrutura do Monorepo

```
code-review-SAST/
├── script/
│   └── scan.sh
├── api/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── submissions.ts
│   │   │   └── ranking.ts
│   │   ├── services/
│   │   │   ├── scorer.ts
│   │   │   └── normalizer.ts
│   │   └── main.ts
│   ├── drizzle.config.ts
│   └── package.json
├── web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── RankingPage.tsx
│   │   │   └── DetailPage.tsx
│   │   ├── components/
│   │   │   ├── RankingTable.tsx
│   │   │   ├── ScoreBar.tsx
│   │   │   └── VulnList.tsx
│   │   └── main.tsx
│   └── package.json
└── k8s/
    ├── api-deployment.yaml
    ├── web-deployment.yaml
    ├── postgres-deployment.yaml
    └── ingress.yaml
```

---

## Deploy (k3s)

| Componente | Tipo k8s | Observação |
|------------|----------|------------|
| PostgreSQL | Deployment + PVC + ClusterIP | PVC para persistência |
| API | Deployment + ClusterIP | `initContainer` roda migrations Drizzle |
| Frontend | Deployment + ClusterIP | build estático servido via nginx |
| Ingress | Traefik (nativo k3s) | `sast.minhavm.com/` → web, `sast.minhavm.com/api/*` → api |

Variáveis de ambiente:
- API: `DATABASE_URL`, `PORT`
- Web: `VITE_API_URL`

---

## Dinâmica da Oficina

1. Apresentar conceitos: SCA, SAST, Secrets Detection, CVE, SBOM
2. Mostrar pipeline CI/CD como contexto real de uso do script
3. Distribuir `scan.sh` + URL do sistema + credenciais de grupo para cada time
4. Grupos executam o script em seus projetos da fábrica
5. Resultados aparecem ao vivo no ranking projetado na tela
6. Discussão dos achados: o que cada vulnerabilidade significa, como corrigir
7. Premiação do grupo com maior score
