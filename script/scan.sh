#!/usr/bin/env bash
# =============================================================
#  scan.sh — SAST Arena Scanner
#  Ferramentas: Syft + Grype (SCA), Semgrep (SAST),
#               Gitleaks (secrets), Trivy (IaC/misconfig)
#  Uso bare-metal: ./scan.sh --group "G1" --name "app" --path ./ --api-url https://...
#  Uso Docker    : docker run --rm -v "$(pwd):/scan" yurizetoles/sast-arena-scanner --group "G1" --name "app"
# =============================================================

set -euo pipefail

# --- Cores ---
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# --- Defaults ---
GROUP_NAME=""
PROJECT_NAME=""
PROJECT_PATH="."
API_URL="${SAST_API_URL:-}"

# --- PIDs dos processos em background ---
SEMGREP_PID=""
GITLEAKS_PID=""
TRIVY_PID=""

# --- Tempo de início ---
START_TIME=$SECONDS

# --- Arquivos temporários ---
SBOM_FILE="$(mktemp /tmp/sbom.XXXXXX.json)"
GRYPE_FILE="$(mktemp /tmp/grype.XXXXXX.json)"
SEMGREP_FILE="$(mktemp /tmp/semgrep.XXXXXX.json)"
GITLEAKS_FILE="$(mktemp /tmp/gitleaks.XXXXXX.json)"
TRIVY_FILE="$(mktemp /tmp/trivy.XXXXXX.json)"
PAYLOAD_FILE="$(mktemp /tmp/payload.XXXXXX.json)"

cleanup() {
  kill "${SEMGREP_PID:-}" "${GITLEAKS_PID:-}" "${TRIVY_PID:-}" 2>/dev/null || true
  rm -f "$SBOM_FILE" "$GRYPE_FILE" "$SEMGREP_FILE" "$GITLEAKS_FILE" "$TRIVY_FILE" "$PAYLOAD_FILE"
}
trap cleanup EXIT INT TERM

# --- DRY: roda ferramenta com fallback em caso de erro ---
run_tool() {
  local label="$1" fallback="$2" outfile="$3"
  shift 3
  if ! "$@" > "$outfile" 2>/tmp/sast_err.log; then
    echo -e "  ${YELLOW}⚠${RESET} $label falhou — usando fallback vazio"
    printf '%s' "$fallback" > "$outfile"
  fi
}

# --- Parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --group)    GROUP_NAME="$2";   shift 2 ;;
    --name)     PROJECT_NAME="$2"; shift 2 ;;
    --path)     PROJECT_PATH="$2"; shift 2 ;;
    --api-url)  API_URL="$2";      shift 2 ;;
    *) echo "Argumento desconhecido: $1"; exit 1 ;;
  esac
done

# --- Validações ---
if [[ -z "$GROUP_NAME" || -z "$PROJECT_NAME" ]]; then
  echo -e "${RED}Uso: $0 --group <nome> --name <projeto> [--path <dir>] [--api-url <url>]${RESET}"
  exit 1
fi

if [[ -z "$API_URL" ]]; then
  echo -e "${RED}Erro: --api-url é obrigatório (ou defina SAST_API_URL).${RESET}"
  exit 1
fi

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo -e "${RED}Erro: diretório '$PROJECT_PATH' não existe.${RESET}"
  exit 1
fi

# --- git safe.directory (necessário dentro de container) ---
git config --global --add safe.directory '*' 2>/dev/null || true

# --- Header ---
echo -e "\n${BOLD}${CYAN}========================================${RESET}"
echo -e "${BOLD}${CYAN}  🔒 SAST Arena Scanner${RESET}"
echo -e "${BOLD}${CYAN}========================================${RESET}\n"
echo -e "  Grupo    : ${BOLD}${GROUP_NAME}${RESET}"
echo -e "  Projeto  : ${BOLD}${PROJECT_NAME}${RESET}"
echo -e "  Diretório: ${PROJECT_PATH}\n"

# --- Verificar dependências ---
echo -e "${BOLD}Verificando dependências...${RESET}"
MISSING=0
for cmd in syft grype semgrep gitleaks trivy jq curl; do
  if command -v "$cmd" &>/dev/null; then
    echo -e "  ${GREEN}✔${RESET} $cmd"
  else
    echo -e "  ${RED}✘ $cmd não encontrado${RESET}"
    MISSING=1
  fi
done
if [[ "$MISSING" -eq 1 ]]; then
  echo -e "\n${RED}Instale as dependências acima.${RESET}\n"
  exit 1
fi
echo ""

# --- Versões ---
SYFT_VERSION=$(syft --version 2>/dev/null | awk '{print $2}' || echo "unknown")
GRYPE_VERSION=$(grype version 2>/dev/null | grep "^Version" | awk '{print $2}' || echo "unknown")
SEMGREP_VERSION=$(semgrep --version 2>/dev/null || echo "unknown")
GITLEAKS_VERSION=$(gitleaks version 2>/dev/null || echo "unknown")
TRIVY_VERSION=$(trivy --version 2>/dev/null | head -1 | awk '{print $2}' || echo "unknown")

# --- Identidade do projeto ---
PROJECT_VERSION="local"
REPO_URL=""
if git -C "$PROJECT_PATH" rev-parse --short HEAD &>/dev/null; then
  PROJECT_VERSION=$(git -C "$PROJECT_PATH" rev-parse --short HEAD)
  REPO_URL=$(git -C "$PROJECT_PATH" remote get-url origin 2>/dev/null || echo "")
fi

# --- [1/4] SCA: Syft + Grype ---
echo -e "${BOLD}[1/4] SCA — Syft + Grype (CVEs)...${RESET}"
echo -e "  Atualizando base de CVEs..."
grype db update 2>/dev/null || echo -e "  ${YELLOW}⚠${RESET} db update falhou — usando base local"

run_tool "syft" \
  '{"artifacts":[],"matches":[]}' \
  "$SBOM_FILE" \
  syft dir:"$PROJECT_PATH" -o json

run_tool "grype" \
  '{"matches":[]}' \
  "$GRYPE_FILE" \
  grype sbom:"$SBOM_FILE" -o json

GRYPE_COUNT=$(jq '.matches | length' "$GRYPE_FILE" 2>/dev/null || echo 0)
echo -e "  ${GREEN}✔${RESET} ${GRYPE_COUNT} CVEs encontrados\n"

# --- [2/4] SAST: Semgrep (background) ---
echo -e "${BOLD}[2/4] SAST — Semgrep...${RESET}"
semgrep \
  --config=p/security-audit \
  --config=p/owasp-top-ten \
  --config=p/cwe-top-25 \
  --config=p/secrets \
  --config=p/default \
  --config=p/insecure-transport \
  --config=p/jwt \
  --timeout 30 \
  --exclude node_modules \
  --exclude vendor \
  --exclude dist \
  --exclude build \
  --exclude .git \
  --json \
  --output "$SEMGREP_FILE" \
  "$PROJECT_PATH" 2>/dev/null || true &
SEMGREP_PID=$!

# --- [3/4] Secrets: Gitleaks (background) ---
echo -e "${BOLD}[3/4] Secrets — Gitleaks...${RESET}"
gitleaks detect \
  --source "$PROJECT_PATH" \
  --report-format json \
  --report-path "$GITLEAKS_FILE" \
  --redact \
  --exit-code 0 \
  2>/dev/null || true &
GITLEAKS_PID=$!

# --- [4/4] IaC: Trivy (background) ---
echo -e "${BOLD}[4/4] IaC/Misconfig — Trivy...${RESET}"
trivy fs \
  --scanners misconfig \
  --format json \
  --output "$TRIVY_FILE" \
  --exit-code 0 \
  --quiet \
  "$PROJECT_PATH" 2>/dev/null || true &
TRIVY_PID=$!

# --- Aguardar processos em background ---
wait $SEMGREP_PID
if [[ ! -f "$SEMGREP_FILE" ]] || ! jq -e '.results' "$SEMGREP_FILE" &>/dev/null; then
  echo '{"results":[]}' > "$SEMGREP_FILE"
fi
SEMGREP_COUNT=$(jq '.results | length' "$SEMGREP_FILE")
echo -e "  ${GREEN}✔${RESET} ${SEMGREP_COUNT} findings encontrados\n"

wait $GITLEAKS_PID
if [[ ! -f "$GITLEAKS_FILE" ]]; then
  echo '[]' > "$GITLEAKS_FILE"
fi
GITLEAKS_COUNT=$(jq '. | length' "$GITLEAKS_FILE")
echo -e "  ${GREEN}✔${RESET} ${GITLEAKS_COUNT} secrets encontrados\n"

wait $TRIVY_PID
if [[ ! -f "$TRIVY_FILE" ]] || ! jq -e '.Results' "$TRIVY_FILE" &>/dev/null; then
  echo '{"SchemaVersion":2,"Results":[]}' > "$TRIVY_FILE"
fi
TRIVY_COUNT=$(jq '[.Results[]?.Misconfigurations // [] | .[]] | length' "$TRIVY_FILE" 2>/dev/null || echo 0)
echo -e "  ${GREEN}✔${RESET} ${TRIVY_COUNT} misconfigs encontradas\n"

# --- Montar payload ---
echo -e "${BOLD}Enviando resultados...${RESET}"
REPO_URL_ARG="null"
if [[ -n "$REPO_URL" ]]; then
  REPO_URL_ARG="\"$REPO_URL\""
fi

jq -n \
  --arg group    "$GROUP_NAME" \
  --arg name     "$PROJECT_NAME" \
  --arg version  "$PROJECT_VERSION" \
  --argjson repo_url "$REPO_URL_ARG" \
  --arg syft_v   "$SYFT_VERSION" \
  --arg grype_v  "$GRYPE_VERSION" \
  --arg sg_v     "$SEMGREP_VERSION" \
  --arg gl_v     "$GITLEAKS_VERSION" \
  --arg trivy_v  "$TRIVY_VERSION" \
  --slurpfile grype    "$GRYPE_FILE" \
  --slurpfile semgrep  "$SEMGREP_FILE" \
  --slurpfile gitleaks "$GITLEAKS_FILE" \
  --slurpfile trivy    "$TRIVY_FILE" \
  '{
    group_name: $group,
    project_name: $name,
    project_version: $version,
    repo_url: $repo_url,
    tool_versions: {
      syft: $syft_v,
      grype: $grype_v,
      semgrep: $sg_v,
      gitleaks: $gl_v,
      trivy: $trivy_v
    },
    grype: $grype[0],
    semgrep: $semgrep[0],
    gitleaks: $gitleaks[0],
    trivy: $trivy[0]
  }' > "$PAYLOAD_FILE"

RESPONSE=$(curl -s --fail --max-time 30 -X POST "${API_URL}/api/submissions" \
  -H "Content-Type: application/json" \
  -d @"$PAYLOAD_FILE") || {
  echo -e "\n${RED}Erro: API inacessível ou timeout (${API_URL}).${RESET}"
  exit 1
}

# --- Exibir resultado ---
SCORE=$(echo "$RESPONSE" | jq -r '.score // "erro"')
BREAKDOWN=$(echo "$RESPONSE" | jq -r '.breakdown // {}')

if [[ "$SCORE" == "erro" ]]; then
  echo -e "\n${RED}Erro ao enviar para a API:${RESET}"
  echo "$RESPONSE" | jq .
  exit 1
fi

ELAPSED=$(( SECONDS - START_TIME ))

echo -e "\n${BOLD}========================================${RESET}"
echo -e "${BOLD}  📊 Resultado — ${GROUP_NAME} / ${PROJECT_NAME}${RESET}"
echo -e "${BOLD}========================================${RESET}"

if [[ "$SCORE" -ge 80 ]]; then
  COLOR="${GREEN}"
elif [[ "$SCORE" -ge 50 ]]; then
  COLOR="${YELLOW}"
else
  COLOR="${RED}"
fi

echo -e "  Score: ${COLOR}${BOLD}${SCORE}/100${RESET}\n"
echo -e "  CVEs Critical  : $(echo "$BREAKDOWN" | jq -r '.critical')"
echo -e "  CVEs High      : $(echo "$BREAKDOWN" | jq -r '.high')"
echo -e "  CVEs Medium    : $(echo "$BREAKDOWN" | jq -r '.medium')"
echo -e "  CVEs Low       : $(echo "$BREAKDOWN" | jq -r '.low')"
echo -e "  Secrets        : $(echo "$BREAKDOWN" | jq -r '.secrets')"
echo -e "  Misconfigs     : $(echo "$BREAKDOWN" | jq -r '.misconfigs // 0')"
echo -e "\n  Tempo total    : ${ELAPSED}s"
echo -e "\n${GREEN}${BOLD}✅ Enviado! Verifique o ranking em: ${API_URL}${RESET}\n"
