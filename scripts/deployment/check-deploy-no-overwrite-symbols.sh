#!/usr/bin/env bash
# Deploy no-overwrite / freeze gate — 컷오버 전 6항 전부 PASS 필수.
# 부분 tip 단독 PROD 컷오버·한 기능만 넣어 다른 심볼 소실 시 exit 1.
# DATAFIX 0 · 부분 tip 금지 (운영 정책).
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
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
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

echo "=== deploy freeze gate (6-item / source: $ROOT) ==="
echo "POLICY: DATAFIX 0 · partial tip alone = merge/deploy forbidden"
echo

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

# ---------------------------------------------------------------------------
# 1) IL SSOT / institution-link log
# ---------------------------------------------------------------------------
echo "--- [1/6] IL SSOT / institution-link log ---"
require_file \
  "src/main/java/com/coresolution/consultation/service/ConsultationLogExistenceSsot.java" \
  "ConsultationLogExistenceSsot"
require_file \
  "src/main/java/com/coresolution/consultation/service/impl/ConsultationLogExistenceSsotImpl.java" \
  "ConsultationLogExistenceSsotImpl"
require_file \
  "src/main/java/com/coresolution/consultation/controller/InstitutionLinkConsultationLogController.java" \
  "InstitutionLinkConsultationLogController"
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

# ---------------------------------------------------------------------------
# 2) ProvisionalConsultationLogSession (가예약 일지 tip)
# ---------------------------------------------------------------------------
echo "--- [2/6] ProvisionalConsultationLogSession ---"
require_file \
  "src/main/java/com/coresolution/consultation/util/ProvisionalConsultationLogSession.java" \
  "ProvisionalConsultationLogSession"
require_grep \
  "src/main/java/com/coresolution/consultation/service/impl/ConsultationRecordServiceImpl.java" \
  "ProvisionalConsultationLogSession" \
  "ConsultationRecordServiceImpl uses ProvisionalConsultationLogSession"
require_grep \
  "src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java" \
  "ProvisionalConsultationLogSession" \
  "ScheduleServiceImpl uses ProvisionalConsultationLogSession"

# ---------------------------------------------------------------------------
# 3) 가예약 OPEN 점유 드래그 차단
# ---------------------------------------------------------------------------
echo "--- [3/6] OPEN occupancy drag block (hasOpenOccupying / provisional_already_has_schedule) ---"
require_grep \
  "frontend/src/utils/scheduleExternalDropGuards.js" \
  "hasOpenOccupyingConsultationSchedule" \
  "FE hasOpenOccupyingConsultationSchedule"
require_grep \
  "frontend/src/utils/scheduleExternalDropGuards.js" \
  "provisional_already_has_schedule" \
  "FE provisional_already_has_schedule"
require_grep \
  "src/main/java/com/coresolution/consultation/controller/AdminController.java" \
  "hasOpenOccupyingConsultationSchedule" \
  "AdminController hasOpenOccupyingConsultationSchedule enrich"

# ---------------------------------------------------------------------------
# 4) SessionTransferHistorySection 마운트
# ---------------------------------------------------------------------------
echo "--- [4/6] SessionTransferHistorySection mount (session-transfer-history) ---"
require_file \
  "frontend/src/components/admin/session-transfer-history/SessionTransferHistorySection.js" \
  "SessionTransferHistorySection"
require_grep \
  "frontend/src/components/admin/session-transfer-history/SessionTransferHistorySection.js" \
  "session-transfer-history" \
  "SessionTransferHistorySection session-transfer-history class/testid"
require_grep \
  "frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingScheduleSidePeekContent.js" \
  "SessionTransferHistorySection" \
  "SidePeek mounts SessionTransferHistorySection"
require_file \
  "src/main/java/com/coresolution/consultation/controller/AdminSessionTransferHistoryController.java" \
  "AdminSessionTransferHistoryController"
require_grep \
  "src/main/java/com/coresolution/consultation/controller/AdminSessionTransferHistoryController.java" \
  "session-transfer-history" \
  "API session-transfer-history"

# ---------------------------------------------------------------------------
# 5) CardBillingProgress / consultationSchedules (IL 월·완료일)
# ---------------------------------------------------------------------------
echo "--- [5/6] CardBillingProgress / consultationSchedules ---"
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

# ---------------------------------------------------------------------------
# 6) prepaid 10만 SSOT 표시 없음
# ---------------------------------------------------------------------------
echo "--- [6/6] prepaid 100k must NOT be IL display SSOT ---"
require_file \
  "frontend/src/components/admin/mapping-management/integrated-schedule/utils/mappingPackageDisplay.js" \
  "mappingPackageDisplay"
require_grep \
  "frontend/src/components/admin/mapping-management/integrated-schedule/utils/mappingPackageDisplay.js" \
  "packageName" \
  "mappingPackageDisplay uses packageName SSOT"
require_grep \
  "frontend/src/components/admin/mapping-management/integrated-schedule/utils/mappingPackageDisplay.js" \
  "institutionLinkPrepaidAmount" \
  "mappingPackageDisplay documents ignore of institutionLinkPrepaidAmount"
if [[ -f "$ROOT/frontend/src/components/admin/mapping-management/integrated-schedule/utils/mappingPackageDisplay.js" ]]; then
  if grep -qE "return[^;]*institutionLinkPrepaidAmount|초기상담료\(선납\)" \
    "$ROOT/frontend/src/components/admin/mapping-management/integrated-schedule/utils/mappingPackageDisplay.js"; then
    bad "mappingPackageDisplay must not return prepaid / 초기상담료(선납) as SSOT"
  else
    ok "mappingPackageDisplay does not return prepaid 100k SSOT"
  fi
fi
CARD_UTIL="$ROOT/frontend/src/components/admin/mapping-management/integrated-schedule/utils"
if [[ -d "$CARD_UTIL" ]]; then
  if grep -RInE "초기상담료\(선납\)" "$CARD_UTIL" --include='*.js' 2>/dev/null \
    | grep -vE '__tests__|\.test\.js' | grep -q .; then
    bad "IL card utils contain 초기상담료(선납) label (prepaid 100k SSOT regression)"
  else
    ok "IL card utils have no 초기상담료(선납) prepaid SSOT label"
  fi
else
  bad "IL card utils dir missing ($CARD_UTIL)"
fi

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
    if jar tf "$JAR_PATH" 2>/dev/null | grep -q 'ProvisionalConsultationLogSession'; then
      ok "JAR contains ProvisionalConsultationLogSession"
    else
      bad "JAR missing ProvisionalConsultationLogSession class"
    fi
    if jar tf "$JAR_PATH" 2>/dev/null | grep -q 'AdminSessionTransferHistoryController'; then
      ok "JAR contains AdminSessionTransferHistoryController"
    else
      bad "JAR missing AdminSessionTransferHistoryController class"
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
    if find "$FE_DIR" -type f \( -name 'main*.js' -o -name '*.js' \) 2>/dev/null \
      | head -200 \
      | xargs -r grep -l 'cf9a5138' 2>/dev/null \
      | head -1 | grep -q .; then
      echo "  WARN cf9a5138 marker seen in FE assets (card-only tip 계열) — full 6-item symbols required"
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
      | xargs -r grep -lE 'session-transfer-history|SessionTransferHistorySection' 2>/dev/null \
      | head -1 | grep -q .; then
      ok "FE bundle has session-transfer-history"
    else
      bad "FE bundle missing session-transfer-history"
    fi
    if find "$FE_DIR" -type f -name '*.js' 2>/dev/null \
      | head -300 \
      | xargs -r grep -lE 'hasOpenOccupyingConsultationSchedule|provisional_already_has_schedule' 2>/dev/null \
      | head -1 | grep -q .; then
      ok "FE bundle has OPEN occupancy drag block"
    else
      bad "FE bundle missing OPEN occupancy drag block"
    fi
  fi
elif [[ "$STRICT_ARTIFACTS" -eq 1 ]]; then
  bad "--strict-artifacts set but --fe-dir not provided"
fi

echo
echo "=== result: pass=$PASS fail=$FAIL ==="
if [[ "$FAIL" -gt 0 ]]; then
  echo "ABORT: tip lacks required freeze-gate symbols (need all 6 PASS)." >&2
  echo "Do NOT cut over / merge a partial tip. DATAFIX 0. See docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md" >&2
  exit 1
fi
echo "Gate passed — tip contains all 6 no-overwrite / freeze symbols."
exit 0
