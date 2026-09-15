#!/usr/bin/env bash
# Deploy no-overwrite gate — IL SSOT / 일지 모달 / 카드 일정 / Side Peek 이관 이력 심볼 필수.
# 부분 tip(카드-only 등) 단독 PROD 컷오버를 막는다. 심볼 하나라도 없으면 exit 1.
#
# Usage:
#   ./scripts/deployment/check-deploy-no-overwrite-symbols.sh
#   ./scripts/deployment/check-deploy-no-overwrite-symbols.sh --source-root /path/to/tip
#   ./scripts/deployment/check-deploy-no-overwrite-symbols.sh --jar app.jar --fe-dir /var/www/mindgarden/frontend
#
# 문서: docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md

set -euo pipefail

SOURCE_ROOT="."
JAR_PATH=""
FE_DIR=""
STRICT_ARTIFACTS=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-root) SOURCE_ROOT="${2:-}"; shift 2 ;;
    --jar) JAR_PATH="${2:-}"; shift 2 ;;
    --fe-dir) FE_DIR="${2:-}"; shift 2 ;;
    --strict-artifacts) STRICT_ARTIFACTS=1; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

ROOT="$(cd "$SOURCE_ROOT" && pwd)"
FAIL=0
PASS=0

ok() { echo "  OK  $1"; PASS=$((PASS + 1)); }
bad() { echo "  FAIL $1" >&2; FAIL=$((FAIL + 1)); }

echo "=== deploy no-overwrite gate (source: $ROOT) ==="

# --- Source tree (배포 tip checkout) ---
require_file() {
  local rel="$1"
  local label="$2"
  if [[ -f "$ROOT/$rel" ]]; then
    ok "source $label ($rel)"
  else
    bad "source missing $label ($rel)"
  fi
}

require_grep() {
  local rel="$1"
  local pattern="$2"
  local label="$3"
  if [[ -f "$ROOT/$rel" ]] && grep -qE "$pattern" "$ROOT/$rel"; then
    ok "source $label"
  else
    bad "source missing pattern for $label ($pattern in $rel)"
  fi
}

# JAR: ConsultationLogExistenceSsot + InstitutionLink consultation log controller
require_file \
  "src/main/java/com/coresolution/consultation/service/ConsultationLogExistenceSsot.java" \
  "ConsultationLogExistenceSsot"
require_file \
  "src/main/java/com/coresolution/consultation/service/impl/ConsultationLogExistenceSsotImpl.java" \
  "ConsultationLogExistenceSsotImpl"
require_file \
  "src/main/java/com/coresolution/consultation/controller/InstitutionLinkConsultationLogController.java" \
  "InstitutionLinkConsultationLogController"

# FE: IL consultation API helper + modal flag
require_file \
  "frontend/src/utils/consultationLogInstitutionContext.js" \
  "consultationLogInstitutionContext"
require_grep \
  "frontend/src/utils/consultationLogInstitutionContext.js" \
  "institution-link/consultation-records|_institutionLinkLog" \
  "IL consultation API / _institutionLinkLog"
require_grep \
  "frontend/src/components/consultant/ConsultationLogModal.js" \
  "_institutionLinkLog" \
  "ConsultationLogModal _institutionLinkLog"

# FE: CardBillingProgress + consultationSchedules (권장·가능하면 필수)
require_file \
  "frontend/src/components/admin/mapping-management/integrated-schedule/molecules/CardBillingProgress.js" \
  "CardBillingProgress"
require_grep \
  "frontend/src/components/admin/mapping-management/integrated-schedule/molecules/CardBillingProgress.js" \
  "consultationSchedules" \
  "CardBillingProgress consultationSchedules"
require_grep \
  "src/main/java/com/coresolution/consultation/controller/AdminController.java" \
  "consultationSchedules" \
  "AdminController consultationSchedules enrich"

# FE: Side Peek 「회기 승계·이관 이력」— 파일 + 심볼 + JSX 마운트
# (이전 게이트는 IL/카드만 검사 → import 삭제·마운트 제거 회귀를 못 막음)
SIDEPEEK_REL="frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingScheduleSidePeekContent.js"
require_file \
  "frontend/src/components/admin/session-transfer-history/SessionTransferHistorySection.js" \
  "SessionTransferHistorySection"
require_grep \
  "frontend/src/components/admin/session-transfer-history/SessionTransferHistorySection.js" \
  "session-transfer-history|회기 승계" \
  "SessionTransferHistorySection session-transfer-history / 회기 승계"
require_grep \
  "$SIDEPEEK_REL" \
  "import[[:space:]]+SessionTransferHistorySection" \
  "MappingScheduleSidePeekContent imports SessionTransferHistorySection"
# JSX mount only — import alone must fail
require_grep \
  "$SIDEPEEK_REL" \
  "<SessionTransferHistorySection(\\s|>|/)" \
  "MappingScheduleSidePeekContent mounts <SessionTransferHistorySection />"

# --- Built JAR (optional) ---
if [[ -n "$JAR_PATH" ]]; then
  if [[ ! -f "$JAR_PATH" ]]; then
    bad "JAR not found: $JAR_PATH"
  else
    echo "--- JAR: $JAR_PATH ---"
    if jar tf "$JAR_PATH" 2>/dev/null | grep -q 'ConsultationLogExistenceSsot'; then
      ok "JAR contains ConsultationLogExistenceSsot"
    else
      bad "JAR missing ConsultationLogExistenceSsot class"
    fi
    if jar tf "$JAR_PATH" 2>/dev/null | grep -q 'InstitutionLinkConsultationLogController'; then
      ok "JAR contains InstitutionLinkConsultationLogController"
    else
      bad "JAR missing InstitutionLinkConsultationLogController"
    fi
  fi
elif [[ "$STRICT_ARTIFACTS" -eq 1 ]]; then
  bad "--strict-artifacts set but --jar not provided"
fi

# --- Built / deployed FE bundle (optional) ---
if [[ -n "$FE_DIR" ]]; then
  if [[ ! -d "$FE_DIR" ]]; then
    bad "FE dir not found: $FE_DIR"
  else
    echo "--- FE dir: $FE_DIR ---"
    # 카드-only tip 해시 단독 컷오버 금지 신호
    if find "$FE_DIR" -type f \( -name 'main*.js' -o -name '*.js' \) 2>/dev/null \
      | head -200 \
      | xargs -r grep -l 'cf9a5138' 2>/dev/null \
      | head -1 | grep -q .; then
      # 해시만으로는 부족 — 필수 심볼 동시 검사
      echo "  WARN cf9a5138 marker seen in FE assets (card-only tip 계열) — IL symbols required"
    fi
    if find "$FE_DIR" -type f -name '*.js' 2>/dev/null \
      | head -300 \
      | xargs -r grep -lE '_institutionLinkLog|institution-link/consultation-records' 2>/dev/null \
      | head -1 | grep -q .; then
      ok "FE bundle has IL consultation / _institutionLinkLog"
    else
      bad "FE bundle missing IL consultation / _institutionLinkLog"
    fi
    if find "$FE_DIR" -type f -name '*.js' 2>/dev/null \
      | head -300 \
      | xargs -r grep -lE 'CardBillingProgress|consultationSchedules' 2>/dev/null \
      | head -1 | grep -q .; then
      ok "FE bundle has CardBillingProgress / consultationSchedules"
    else
      bad "FE bundle missing CardBillingProgress / consultationSchedules"
    fi
    if find "$FE_DIR" -type f -name '*.js' 2>/dev/null \
      | head -300 \
      | xargs -r grep -lE 'SessionTransferHistorySection|session-transfer-history|회기 승계' 2>/dev/null \
      | head -1 | grep -q .; then
      ok "FE bundle has SessionTransferHistory / session-transfer-history / 회기 승계"
    else
      bad "FE bundle missing SessionTransferHistory / session-transfer-history / 회기 승계"
    fi
  fi
elif [[ "$STRICT_ARTIFACTS" -eq 1 ]]; then
  bad "--strict-artifacts set but --fe-dir not provided"
fi

echo "=== result: pass=$PASS fail=$FAIL ==="
if [[ "$FAIL" -gt 0 ]]; then
  echo "ABORT: feature tip lacks required IL SSOT / log modal / card schedule / Side Peek transfer-history symbols." >&2
  echo "Do NOT cut over PROD with a partial tip (e.g. card-only cf9a5138). See docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md" >&2
  exit 1
fi
echo "Gate passed — tip contains required no-overwrite symbols."
exit 0
