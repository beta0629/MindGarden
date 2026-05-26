#!/usr/bin/env bash
# D5 P4 i18n Phase 2 — PR-M KPI 측정 산식 (§C11=b 통일)
#
# §C11=b 정책: 한국어 라인 KPI 산식 (console.log 보존, KPI 제외)
#
# 본 스크립트는 5종 KPI 를 단일 산식으로 출력 (--json 옵션 시 JSON 출력).
#
#   1. 한국어 라인 (§C11=b grep, console 제외)
#   2. t() 호출 (raw count)
#   3. useTranslation 파일 (component-level hook 사용 파일 수)
#   4. ko leaves (14 namespace 합계)
#   5. fallback 인자 (PR-L 정착 후 0 유지)
#
# 사용:
#   bash scripts/d5-p4-i18n/measure_kpi.sh
#   bash scripts/d5-p4-i18n/measure_kpi.sh --json
#
# @author core-coder (PR-M Wave-4)
# @since 2026-05-26
set -uo pipefail
# `grep -v` returns 1 when 0 matches — we tolerate 0-line scenarios.

JSON=0
if [ "${1:-}" = "--json" ]; then JSON=1; fi

ROOT="$(git rev-parse --show-toplevel)"
SRC="${ROOT}/frontend/src"
LOCALES_KO="${SRC}/locales/ko"

# 1. 한국어 라인 (§C11=b 산식 — console.log 제외)
KO_LINES=$(grep -rnE "[가-힣]" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "__tests__/" \
  | grep -v "\.test\." \
  | grep -v "\.spec\." \
  | grep -vE "console\.(log|warn|info|debug|error|trace)" \
  | wc -l | tr -d ' ')

# 1.b 한국어 라인 (console 포함, 비교용)
KO_LINES_INCL=$(grep -rnE "[가-힣]" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "__tests__/" \
  | grep -v "\.test\." \
  | grep -v "\.spec\." \
  | wc -l | tr -d ' ')

# 1.c console.log 한국어 라인 (보존 검증, §C11=b)
KO_CONSOLE=$(grep -rnE "[가-힣]" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "__tests__/" \
  | grep -v "\.test\." \
  | grep -v "\.spec\." \
  | grep -E "console\.(log|warn|info|debug|error|trace)" \
  | wc -l | tr -d ' ')

# 2. t() 호출 (raw)
T_CALLS=$(grep -rohE "\bt\(" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "__tests__/" \
  | wc -l | tr -d ' ')

# 3. useTranslation 파일
USE_TRANSLATION_FILES=$(grep -rl "useTranslation" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | wc -l | tr -d ' ')

# 4. ko leaves (14 namespace)
KO_LEAVES=$(node -e "
const fs=require('fs');
const path=require('path');
const ns=['admin','auth','common','erp','error','manualNotification','report','schedule','settings','smsTemplate','statistics','systemConfig','terms','testNotification'];
function leaves(d){if(typeof d!=='object'||d===null)return 1;let n=0;for(const k in d){n+=leaves(d[k]);}return n;}
let total=0;
for(const n of ns){
  const p='${LOCALES_KO}/'+n+'.json';
  const d=JSON.parse(fs.readFileSync(p,'utf8'));
  total+=leaves(d);
}
console.log(total);
")

# 5. fallback 인자 (PR-L 정착 후 0 유지) — t('key', '한국어 fallback') 패턴
# 주석 (`//`, `*`, `/*`) 라인 제외 — JSDoc 예시 false positive 회피
FALLBACK_T=$(grep -rnE "\bt\([^,]+,\s*['\"]\s*[가-힣]" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "__tests__/" \
  | grep -vE ":\s*\*" \
  | grep -vE ":\s*//" \
  | grep -vE ":\s*/\*" \
  | wc -l | tr -d ' ')

# 6. fallback i18n.t (PR-M 적용 i18n.t 호출 — 통계만)
I18N_T=$(grep -rohE "\bi18n\.t\(" "$SRC" \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null \
  | wc -l | tr -d ' ')

if [ $JSON -eq 1 ]; then
  cat <<EOF
{
  "kpi_formula": "§C11=b (console.log 제외)",
  "ko_lines_kpi": ${KO_LINES},
  "ko_lines_incl_console": ${KO_LINES_INCL},
  "ko_lines_console_only": ${KO_CONSOLE},
  "t_calls_raw": ${T_CALLS},
  "i18n_t_calls": ${I18N_T},
  "useTranslation_files": ${USE_TRANSLATION_FILES},
  "ko_leaves_total": ${KO_LEAVES},
  "t_fallback_korean_args": ${FALLBACK_T}
}
EOF
else
  echo "============================================================"
  echo " D5 P4 i18n Phase 2 — PR-M KPI 측정 (§C11=b 산식)"
  echo "============================================================"
  echo " 측정 일자       : $(date '+%Y-%m-%d %H:%M:%S')"
  echo " 측정 SHA        : $(git rev-parse --short HEAD)"
  echo " 측정 브랜치     : $(git rev-parse --abbrev-ref HEAD)"
  echo "------------------------------------------------------------"
  echo " 한국어 라인 (§C11=b, console 제외)        : ${KO_LINES}"
  echo " 한국어 라인 (console 포함)                : ${KO_LINES_INCL}"
  echo " 한국어 라인 (console.* only)              : ${KO_CONSOLE}"
  echo " t() 호출 (raw)                            : ${T_CALLS}"
  echo " i18n.t() 호출 (lazy, utils/constants)     : ${I18N_T}"
  echo " useTranslation 파일                       : ${USE_TRANSLATION_FILES}"
  echo " ko leaves 합계 (14 namespace)             : ${KO_LEAVES}"
  echo " t() 한국어 fallback 인자 (PR-L 정착 후 0) : ${FALLBACK_T}"
  echo "============================================================"
  echo " §C11=b 산식: console.log 한국어 메시지 KPI 제외"
  echo " §C12=a 산식: throw new Error i18n 흡수 (Wave-3 27 적용)"
  echo "============================================================"
fi
