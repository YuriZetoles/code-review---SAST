#!/usr/bin/env bash
# =============================================================
#  scan.sh — SAST Arena Scanner
#  Ferramentas: Syft + Grype (SCA), Semgrep (SAST), Gitleaks (secrets)
#  Uso: ./scan.sh --group "Grupo 1" --name "meu-app" --path ./ --api-url https://sast.vm
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
API_URL=""

# --- Arquivos temporários ---
SBOM_FILE="$(mktemp /tmp/sbom.XXXXXX.json)"
GRYPE_FILE="$(mktemp /tmp/grype.XXXXXX.json)"
SEMGREP_FILE="$(mktemp /tmp/semgrep.XXXXXX.json)"
GITLEAKS_FILE="$(mktemp /tmp/gitleaks.XXXXXX.json)"
PAYLOAD_FILE="$(mktemp /tmp/payload.XXXXXX.json)"

cleanup() {
  rm -f "$SBOM_FILE" "$GRYPE_FILE" "$SEMGREP_FILE" "$GITLEAKS_FILE" "$PAYLOAD_FILE"
}
trap cleanup EXIT

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
if [[ -z "$GROUP_NAME" || -z "$PROJECT_NAME" || -z "$API_URL" ]]; then
  echo -e "${RED}Uso: $0 --group <nome> --name <projeto> --path <dir> --api-url <url>${RESET}"
  exit 1
fi

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo -e "${RED}Erro: diretório '$PROJECT_PATH' não existe.${RESET}"
  exit 1
fi

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
for cmd in syft grype semgrep gitleaks jq curl; do
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

# --- Versão e identidade do projeto ---
PROJECT_VERSION="local"
REPO_URL=""
if git -C "$PROJECT_PATH" rev-parse --short HEAD &>/dev/null; then
  PROJECT_VERSION=$(git -C "$PROJECT_PATH" rev-parse --short HEAD)
  REPO_URL=$(git -C "$PROJECT_PATH" remote get-url origin 2>/dev/null || echo "")
fi

# --- SCA: Syft + Grype ---
echo -e "${BOLD}[1/3] SCA — Syft + Grype...${RESET}"
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

# --- SAST: Semgrep + Secrets: Gitleaks (paralelo) ---
echo -e "${BOLD}[2/3] SAST — Semgrep...${RESET}"
semgrep \
  --config=p/security-audit \
  --config=p/owasp-top-ten \
  --config=p/cwe-top-25 \
  --config=p/secrets \
  --config=p/default \
  --timeout 30 \
  --json \
  --output "$SEMGREP_FILE" \
  "$PROJECT_PATH" 2>/dev/null || true &
SEMGREP_PID=$!

echo -e "${BOLD}[3/3] Secrets — Gitleaks...${RESET}"
gitleaks detect \
  --source "$PROJECT_PATH" \
  --report-format json \
  --report-path "$GITLEAKS_FILE" \
  --redact \
  --exit-code 0 \
  2>/dev/null || true &
GITLEAKS_PID=$!

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

# --- Montar payload ---
echo -e "${BOLD}Enviando resultados...${RESET}"
REPO_URL_ARG="null"
if [[ -n "$REPO_URL" ]]; then
  REPO_URL_ARG="\"$REPO_URL\""
fi

jq -n \
  --arg group   "$GROUP_NAME" \
  --arg name    "$PROJECT_NAME" \
  --arg version "$PROJECT_VERSION" \
  --argjson repo_url "$REPO_URL_ARG" \
  --arg syft_v  "$SYFT_VERSION" \
  --arg grype_v "$GRYPE_VERSION" \
  --arg sg_v    "$SEMGREP_VERSION" \
  --arg gl_v    "$GITLEAKS_VERSION" \
  --slurpfile grype    "$GRYPE_FILE" \
  --slurpfile semgrep  "$SEMGREP_FILE" \
  --slurpfile gitleaks "$GITLEAKS_FILE" \
  '{
    group_name: $group,
    project_name: $name,
    project_version: $version,
    repo_url: $repo_url,
    tool_versions: {
      syft: $syft_v,
      grype: $grype_v,
      semgrep: $sg_v,
      gitleaks: $gl_v
    },
    grype: $grype[0],
    semgrep: $semgrep[0],
    gitleaks: $gitleaks[0]
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
echo -e "  CVEs Critical : $(echo "$BREAKDOWN" | jq -r '.critical')"
echo -e "  CVEs High     : $(echo "$BREAKDOWN" | jq -r '.high')"
echo -e "  CVEs Medium   : $(echo "$BREAKDOWN" | jq -r '.medium')"
echo -e "  CVEs Low      : $(echo "$BREAKDOWN" | jq -r '.low')"
echo -e "  Secrets       : $(echo "$BREAKDOWN" | jq -r '.secrets')"
echo -e "\n${GREEN}${BOLD}✅ Enviado! Verifique o ranking em: ${API_URL}${RESET}\n"
