Script:
// scripts/scan-security.sh
#!/bin/bash

# =============================================================
#  scan-security.sh
#  Escaneia vulnerabilidades com Syft + Grype (todas severidades)
# =============================================================

set -euo pipefail

# --- Cores ---
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[0;37m'
BOLD='\033[1m'
RESET='\033[0m'

# --- Configurações ---
SBOM_FILE="sbom.json"
REPORT_FILE="vulnerability-report.json"
TARGET_DIR="${1:-.}"  # Aceita diretório como argumento, padrão: diretório atual

# --- Funções ---
print_header() {
  echo -e "\n${BOLD}${CYAN}========================================${RESET}"
  echo -e "${BOLD}${CYAN}  🔍 Security Scanner - Syft + Grype${RESET}"
  echo -e "${BOLD}${CYAN}========================================${RESET}\n"
}

check_dependencies() {
  echo -e "${BOLD}Verificando dependências...${RESET}"
  local missing=0

  for cmd in syft grype jq; do
    if command -v "$cmd" &>/dev/null; then
      echo -e "  ${GREEN}✔${RESET} $cmd encontrado"
    else
      echo -e "  ${RED}✘ $cmd não encontrado.${RESET} Para instalar:"
      case $cmd in
        syft)  echo -e "    ${CYAN}curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin${RESET}" ;;
        grype) echo -e "    ${CYAN}curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin${RESET}" ;;
        jq)    echo -e "    ${CYAN}sudo apt install jq${RESET}  ou  ${CYAN}brew install jq${RESET}" ;;
      esac
      missing=1
    fi
  done

  if [[ "$missing" -eq 1 ]]; then
    echo -e "\n${RED}${BOLD}⚠️  Instale as dependências acima antes de executar o script.${RESET}\n"
    exit 1
  fi

  echo ""
}

update_db() {
  echo -e "${BOLD}Atualizando banco de vulnerabilidades do Grype...${RESET}"
  grype db update
  echo ""
}

generate_sbom() {
  echo -e "${BOLD}Gerando SBOM para:${RESET} ${CYAN}${TARGET_DIR}${RESET}"
  syft dir:"$TARGET_DIR" -o json > "$SBOM_FILE"
  local pkg_count
  pkg_count=$(jq '.artifacts | length' "$SBOM_FILE")
  echo -e "  ${GREEN}✔${RESET} SBOM gerado com ${BOLD}${pkg_count}${RESET} pacotes → ${SBOM_FILE}\n"
}

scan_vulnerabilities() {
  echo -e "${BOLD}Escaneando vulnerabilidades...${RESET}"
  grype sbom:./"$SBOM_FILE" -o json > "$REPORT_FILE" 2>/dev/null
  echo -e "  ${GREEN}✔${RESET} Relatório completo salvo em → ${REPORT_FILE}\n"
}

count_severity() {
  local severity="$1"
  jq --arg sev "$severity" '[.matches[] | select(.vulnerability.severity == $sev)] | length' "$REPORT_FILE"
}

print_summary() {
  local total critical high medium low negligible unknown

  total=$(jq '[.matches[]] | length' "$REPORT_FILE")
  critical=$(count_severity "Critical")
  high=$(count_severity "High")
  medium=$(count_severity "Medium")
  low=$(count_severity "Low")
  negligible=$(count_severity "Negligible")
  unknown=$(count_severity "Unknown")

  echo -e "${BOLD}========================================${RESET}"
  echo -e "${BOLD}  📊 Resumo${RESET}"
  echo -e "${BOLD}========================================${RESET}"
  echo -e "  Total de vulnerabilidades encontradas : ${BOLD}${total}${RESET}"
  echo -e "  ${RED}🔴 Critical   : ${critical}${RESET}"
  echo -e "  ${YELLOW}🟡 High       : ${high}${RESET}"
  echo -e "  ${MAGENTA}🟠 Medium     : ${medium}${RESET}"
  echo -e "  ${BLUE}🔵 Low        : ${low}${RESET}"
  echo -e "  ${WHITE}⚪ Negligible : ${negligible}${RESET}"
  echo -e "  ${CYAN}❓ Unknown    : ${unknown}${RESET}"
  echo ""
}

print_severity_block() {
  local severity="$1"
  local color="$2"
  local icon="$3"
  local count

  count=$(count_severity "$severity")

  if [[ "$count" -eq 0 ]]; then
    return
  fi

  echo -e "${color}${BOLD}${icon} ${severity^^} (${count})${RESET}"
  echo -e "${color}$(printf '%-30s %-12s %-20s %-15s %s' 'PACOTE' 'VERSÃO' 'CVE' 'SEVERITY' 'FIX')${RESET}"
  echo -e "${color}$(printf '%0.s-' {1..90})${RESET}"

  jq -r --arg sev "$severity" '
    .matches[]
    | select(.vulnerability.severity == $sev)
    | [
        .artifact.name,
        .artifact.version,
        .vulnerability.id,
        .vulnerability.severity,
        (if .vulnerability.fix.versions | length > 0 then .vulnerability.fix.versions[0] else "sem fix" end)
      ]
    | @tsv
  ' "$REPORT_FILE" | while IFS=$'\t' read -r pkg ver cve sev fix; do
    printf "${color}%-30s %-12s %-20s %-15s %s${RESET}\n" "$pkg" "$ver" "$cve" "$sev" "$fix"
  done
  echo ""
}

print_findings() {
  local total
  total=$(jq '[.matches[]] | length' "$REPORT_FILE")

  if [[ "$total" -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✅ Nenhuma vulnerabilidade encontrada!${RESET}\n"
    return
  fi

  echo -e "${BOLD}========================================${RESET}"
  echo -e "${BOLD}  🚨 Vulnerabilidades por Severidade${RESET}"
  echo -e "${BOLD}========================================${RESET}\n"

  print_severity_block "Critical"   "$RED"     "🔴"
  print_severity_block "High"       "$YELLOW"  "🟡"
  print_severity_block "Medium"     "$MAGENTA" "🟠"
  print_severity_block "Low"        "$BLUE"    "🔵"
  print_severity_block "Negligible" "$WHITE"   "⚪"
  print_severity_block "Unknown"    "$CYAN"    "❓"
}laude

cleanup() {
  echo -e "${BOLD}Limpando arquivos temporários...${RESET}"
  rm -f "$SBOM_FILE"
  echo -e "  ${GREEN}✔${RESET} sbom.json removido"
  echo -e "  📄 Relatório JSON mantido em: ${BOLD}${REPORT_FILE}${RESET}\n"
}

print_done() {
  echo -e "${GREEN}${BOLD}✅ Scan concluído! Verifique os resultados acima.${RESET}\n"
}

# --- Main ---
print_header
check_dependencies
update_db
generate_sbom
scan_vulnerabilities
print_summary
print_findings
cleanup
print_done