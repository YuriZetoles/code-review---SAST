# SAST Arena

Sistema de análise estática de segurança para oficinas práticas. Grupos executam um script local que roda SCA (Syft + Grype), SAST (Semgrep) e detecção de secrets (Gitleaks) em seus projetos, enviam os resultados para uma API central e competem em um ranking ao vivo.

## Estrutura

```
.
├── script/scan.sh        # script da oficina (bash)
├── api/                  # Fastify + TypeScript + Drizzle + PostgreSQL
├── web/                  # React + Vite + TypeScript + Tailwind
└── k8s/                  # manifests Kubernetes (k3s)
```

## Pré-requisitos

### Para rodar localmente (desenvolvimento)

- Node.js 20+
- pnpm 9+
- Docker (para PostgreSQL)
- PostgreSQL 16 (ou via Docker)

### Para executar o scan (script)

- `syft` — geração de SBOM
- `grype` — scan de CVEs
- `semgrep` — análise estática de código
- `gitleaks` — detecção de secrets
- `jq` — processamento de JSON
- `curl` — envio dos resultados

**Instalação das ferramentas de scan:**

```bash
# Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sudo sh -s -- -b /usr/local/bin

# Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sudo sh -s -- -b /usr/local/bin

# Semgrep
pip install semgrep

# Gitleaks
# Linux
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz | sudo tar -xz -C /usr/local/bin

# jq
sudo apt install jq   # ou brew install jq
```

---

## Desenvolvimento local

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Subir PostgreSQL

```bash
docker run -d \
  --name sast-postgres \
  -e POSTGRES_USER=sast \
  -e POSTGRES_PASSWORD=sast \
  -e POSTGRES_DB=sast_arena \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Configurar variáveis de ambiente da API

```bash
cp api/.env.example api/.env
# api/.env já vem configurado para o Docker acima
```

### 4. Rodar migrations

```bash
DATABASE_URL=postgresql://sast:sast@localhost:5432/sast_arena pnpm --filter api db:migrate
```

### 5. Iniciar API

```bash
pnpm dev:api
# API disponível em http://localhost:3000
```

### 6. Iniciar frontend

```bash
pnpm dev:web
# Frontend disponível em http://localhost:5173
```

---

## Testes

```bash
cd api && pnpm test
```

Saída esperada: `19 passed (3 test files)`

---

## Script de scan

### Uso

```bash
./script/scan.sh \
  --group    "Grupo 1" \
  --name     "meu-projeto" \
  --path     ./caminho/do/projeto \
  --api-url  https://sast.minhavm.com
```

### Parâmetros

| Parâmetro | Descrição |
|-----------|-----------|
| `--group` | Nome do grupo (ex: "Grupo 1") |
| `--name` | Nome do projeto |
| `--path` | Caminho do projeto a ser analisado (padrão: `.`) |
| `--api-url` | URL base da API (sem `/api` no final) |

### O que o script faz

1. Verifica dependências instaladas
2. Gera SBOM com Syft
3. Escaneia CVEs com Grype
4. Analisa código com Semgrep (`p/security-audit`)
5. Detecta secrets com Gitleaks
6. Envia resultados via `POST /api/submissions`
7. Exibe score e breakdown no terminal

---

## API — Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/submissions` | Recebe scan bruto, calcula score, persiste |
| `GET` | `/api/ranking` | Ranking ordenado por score |
| `GET` | `/api/submissions/:id` | Detalhe de uma submission |
| `GET` | `/api/submissions/:id/vulnerabilities` | Vulnerabilidades com filtros `?tool=grype&severity=critical` |

### Fórmula de pontuação

```
score = 100
      - (critical × 20)
      - (high     × 10)
      - (medium   ×  5)
      - (low      ×  1)
      - (secrets  × 15)   ← findings do gitleaks
score = max(score, 0)
```

---

## Deploy (k3s)

### 1. Criar namespace

```bash
kubectl create namespace sast-arena
```

### 2. Configurar imagens

Edite os arquivos em `k8s/` substituindo `ghcr.io/SEU_USUARIO` pelo seu usuário do GitHub Container Registry:

```bash
sed -i 's|ghcr.io/SEU_USUARIO|ghcr.io/seu-usuario|g' k8s/api-deployment.yaml k8s/web-deployment.yaml
```

### 3. Configurar domínio

Edite `k8s/ingress.yaml` substituindo `sast.minhavm.com` pelo domínio real:

```bash
sed -i 's|sast.minhavm.com|sast.seudominio.com|g' k8s/ingress.yaml
```

### 4. Build e push das imagens

```bash
# API
docker build -f api/Dockerfile -t ghcr.io/seu-usuario/sast-arena-api:latest .
docker push ghcr.io/seu-usuario/sast-arena-api:latest

# Web (substituir pela URL real da API)
docker build -f web/Dockerfile \
  --build-arg VITE_API_URL=https://sast.seudominio.com \
  -t ghcr.io/seu-usuario/sast-arena-web:latest .
docker push ghcr.io/seu-usuario/sast-arena-web:latest
```

### 5. Aplicar manifests

```bash
kubectl apply -f k8s/
```

### 6. Verificar pods

```bash
kubectl get pods -n sast-arena
```

Saída esperada:
```
NAME                        READY   STATUS    RESTARTS
postgres-xxx                1/1     Running   0
api-xxx                     1/1     Running   0
web-xxx                     1/1     Running   0
```

O sistema estará disponível em `https://sast.seudominio.com`.

---

## Roteamento Ingress (Traefik)

| Caminho | Destino |
|---------|---------|
| `sast.seudominio.com/api/*` | api:3000 |
| `sast.seudominio.com/` | web:80 |

---

## Dinâmica da oficina

1. Apresentar conceitos: SCA, SAST, Secrets Detection, CVE, SBOM
2. Mostrar pipeline CI/CD como contexto real de uso do script
3. Distribuir `scan.sh` + URL do sistema para cada grupo
4. Grupos executam o script em seus projetos
5. Resultados aparecem ao vivo no ranking projetado na tela
6. Discussão dos achados: o que cada vulnerabilidade significa e como corrigir
7. Premiação do grupo com maior score (🥇)
