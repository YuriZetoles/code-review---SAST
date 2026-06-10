#!/usr/bin/env bash
# =============================================================
#  scan.sh -- SAST Arena Scanner
#  Ferramentas: Syft + Grype (SCA), Semgrep (SAST),
#               Gitleaks (secrets), Trivy (IaC/misconfig)
#  Uso bare-metal: ./scan.sh --group "G1" --name "app" --path ./ --api-url https://...
#  Uso Docker    : docker run --rm -it -v "$(pwd):/scan" yurizetoles/sast-arena-scanner
# =============================================================

set -euo pipefail

# --- Cores ---
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# --- Helpers de output ---
info()    { echo -e "${DIM}>${RESET} $*"; }
ok()      { echo -e "${BOLD}+${RESET} $*"; }
warn()    { echo -e "${BOLD}!${RESET} $*"; }
fail()    { echo -e "${BOLD}x${RESET} $*"; }
section() { echo -e "\n${BOLD}:: $*${RESET}"; }
divider() { echo -e "${DIM}────────────────────────────────────────${RESET}"; }

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
    warn "$label falhou -- usando fallback vazio"
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

# --- Header (limpa tela se modo interativo) ---
if [[ -z "$GROUP_NAME" || -z "$PROJECT_NAME" ]]; then
  clear
fi
echo ""
divider
echo -e "  ${BOLD}SAST Arena Scanner${RESET}"
divider
echo ""

# --- Auto-detectar nome do projeto via git remote ---
if [[ -z "$PROJECT_NAME" ]]; then
  _git_remote=$(git -C "$PROJECT_PATH" remote get-url origin 2>/dev/null || true)
  if [[ -n "$_git_remote" ]]; then
    PROJECT_NAME=$(echo "$_git_remote" | tr -d '[:space:]' | sed 's|.*/||' | sed 's|\.git$||')
  fi
fi

# --- Prompt interativo se args não fornecidos ---
if [[ -z "$GROUP_NAME" ]]; then
  read -rp $'\e[1mGrupo:\e[0m ' GROUP_NAME
fi
if [[ -z "$PROJECT_NAME" ]]; then
  read -rp $'\e[1mProjeto:\e[0m ' PROJECT_NAME
fi
echo ""

# --- Validações ---
if [[ -z "$GROUP_NAME" || -z "$PROJECT_NAME" ]]; then
  fail "Grupo e nome do projeto sao obrigatorios."
  exit 1
fi

if [[ -z "$API_URL" ]]; then
  fail "--api-url e obrigatorio (ou defina SAST_API_URL)."
  exit 1
fi

if [[ ! -d "$PROJECT_PATH" ]]; then
  fail "Diretorio '$PROJECT_PATH' nao existe."
  exit 1
fi

# --- git safe.directory (necessario dentro de container) ---
git config --global --add safe.directory '*' 2>/dev/null || true

divider
info "Grupo:${BOLD}${GROUP_NAME}${RESET}"
info "Projeto:${BOLD}${PROJECT_NAME}${RESET}"
info "Diretorio:${PROJECT_PATH}"

# --- Verificar dependencias ---
section "Verificando dependencias"
MISSING=0
for cmd in syft grype semgrep gitleaks trivy jq curl; do
  if command -v "$cmd" &>/dev/null; then
    ok "$cmd"
  else
    fail "$cmd nao encontrado."
    MISSING=1
  fi
done
if [[ "$MISSING" -eq 1 ]]; then
  echo ""
  fail "Instale as dependencias listadas acima."
  exit 1
fi

# --- Versoes ---
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
  _raw_url=$(git -C "$PROJECT_PATH" remote get-url origin 2>/dev/null | tr -d '[:space:]' || echo "")
  # Normalizar para HTTPS — qualquer outro formato vira null
  if [[ "$_raw_url" =~ ^git@ ]]; then
    REPO_URL=$(echo "$_raw_url" | sed 's|^git@\([^:]*\):\(.*\)$|https://\1/\2|' | sed 's|\.git$||' | tr -d '[:space:]')
  elif [[ "$_raw_url" =~ ^ssh:// ]]; then
    REPO_URL=$(echo "$_raw_url" | sed 's|^ssh://git@\(.*\)$|https://\1|' | sed 's|\.git$||' | tr -d '[:space:]')
  elif [[ "$_raw_url" =~ ^https?:// ]]; then
    REPO_URL=$(echo "$_raw_url" | sed 's|\.git$||' | tr -d '[:space:]')
  fi
fi

# --- [1/4] SCA: Syft + Grype ---
section "[1/4] SCA -- Syft + Grype"
info "Atualizando base de CVEs..."
grype db update 2>/dev/null || warn "db update falhou -- usando base local"

run_tool "syft" \
  '{"artifacts":[],"matches":[]}' \
  "$SBOM_FILE" \
  syft dir:"$PROJECT_PATH" -o json

run_tool "grype" \
  '{"matches":[]}' \
  "$GRYPE_FILE" \
  grype sbom:"$SBOM_FILE" -o json

GRYPE_COUNT=$(jq '.matches | length' "$GRYPE_FILE" 2>/dev/null || echo 0)
ok "${GRYPE_COUNT} CVEs encontrados"

# --- [2/4] SAST: Semgrep (background) ---
section "[2/4] SAST -- Semgrep"
semgrep \
  --config=p/security-audit \
  --config=p/owasp-top-ten \
  --config=p/cwe-top-25 \
  --config=p/secrets \
  --config=p/default \
  --config=p/insecure-transport \
  --config=p/jwt \
  --timeout 30 \
  --max-memory 2048 \
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
section "[3/4] Secrets -- Gitleaks"
gitleaks detect \
  --source "$PROJECT_PATH" \
  --report-format json \
  --report-path "$GITLEAKS_FILE" \
  --redact \
  --exit-code 0 \
  2>/dev/null || true &
GITLEAKS_PID=$!

# --- [4/4] IaC: Trivy (background) ---
section "[4/4] IaC/Misconfig -- Trivy"
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
ok "${SEMGREP_COUNT} findings encontrados"

wait $GITLEAKS_PID
if [[ ! -f "$GITLEAKS_FILE" ]]; then
  echo '[]' > "$GITLEAKS_FILE"
fi
GITLEAKS_COUNT=$(jq '. | length' "$GITLEAKS_FILE")
ok "${GITLEAKS_COUNT} secrets encontrados"

wait $TRIVY_PID
if [[ ! -f "$TRIVY_FILE" ]] || ! jq -e '.Results' "$TRIVY_FILE" &>/dev/null; then
  echo '{"SchemaVersion":2,"Results":[]}' > "$TRIVY_FILE"
fi
TRIVY_COUNT=$(jq '[.Results[]?.Misconfigurations // [] | .[]] | length' "$TRIVY_FILE" 2>/dev/null || echo 0)
ok "${TRIVY_COUNT} misconfigs encontradas"

# --- Montar payload ---
section "Enviando resultados"
REPO_URL_ARG="null"
if [[ "$REPO_URL" =~ ^https?:// ]]; then
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

_send_payload() {
  local endpoint="${API_URL}/api/submissions${1:-}"
  HTTP_CODE=$(curl -s -o /tmp/sast_response.json -w "%{http_code}" --max-time 60 -X POST "$endpoint" \
    -H "Content-Type: application/json" \
    -d @"$PAYLOAD_FILE") || HTTP_CODE="000"
  RESPONSE=$(cat /tmp/sast_response.json 2>/dev/null || echo '{}')
  rm -f /tmp/sast_response.json
}

_send_payload

if [[ "$HTTP_CODE" == "000" ]]; then
  fail "API inacessivel ou timeout (${API_URL})."
  exit 1
fi

# --- 409: projeto registrado por outro grupo — confirmar sobrescrita ---
if [[ "$HTTP_CODE" == "409" ]]; then
  _detail=$(echo "$RESPONSE" | jq -r '.detail // .error')
  warn "$_detail"
  echo ""
  read -rp $'\e[1mSobrescrever submissao anterior? [s/N]:\e[0m ' _confirm
  echo ""
  if [[ "$_confirm" == "s" || "$_confirm" == "S" ]]; then
    info "Reenviando com force=true..."
    _send_payload "?force=true"
  else
    fail "Envio cancelado."
    exit 1
  fi
fi

# --- Exibir resultado ---
SCORE=$(echo "$RESPONSE" | jq -r '.score // "erro"')
BREAKDOWN=$(echo "$RESPONSE" | jq -r '.breakdown // {}')

if [[ "$SCORE" == "erro" || "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
  fail "Erro ao enviar (HTTP ${HTTP_CODE}):"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

ELAPSED=$(( SECONDS - START_TIME ))

echo ""
divider
echo -e "  ${BOLD}Resultado -- ${GROUP_NAME} / ${PROJECT_NAME}${RESET}"
divider
echo -e "  Score         :${BOLD}${SCORE}/100${RESET}"
echo -e "  CVEs Critical :$(echo "$BREAKDOWN" | jq -r '.critical')"
echo -e "  CVEs High     :$(echo "$BREAKDOWN" | jq -r '.high')"
echo -e "  CVEs Medium   :$(echo "$BREAKDOWN" | jq -r '.medium')"
echo -e "  CVEs Low      :$(echo "$BREAKDOWN" | jq -r '.low')"
echo -e "  Secrets       :$(echo "$BREAKDOWN" | jq -r '.secrets')"
echo -e "  Misconfigs    :$(echo "$BREAKDOWN" | jq -r '.misconfigs // 0')"
echo -e "  Tempo total   :${ELAPSED}s"
divider
ok "Enviado. Ranking: ${API_URL}"
echo ""
