#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
SKIP_DIRS="(frontend-ops/.next|frontend-ops/node_modules|backend-ops/build|\\.git|config/shell-scripts)"

RG_AVAILABLE="yes"
if ! command -v rg >/dev/null 2>&1; then
  echo "⚠️  ripgrep(rg)이 설치되지 않아 기본 grep으로 검사합니다. rg 설치를 권장합니다."
  RG_AVAILABLE="no"
fi

TARGET_DIRS=(
  "$ROOT_DIR/frontend-ops/src"
  "$ROOT_DIR/backend-ops/src/main/java/com/mindgarden/ops"
  "$ROOT_DIR/backend-ops/src/main/resources"
)

echo "🔍 하드코딩 문자열, 상수 미사용 여부 점검 시작 (대상: frontend-ops/src, backend-ops ops 모듈)"
issues=0

run_grep() {
  local pattern="$1"
  local message=""
  local ignore=""
  local matches=""

  if [[ $# -ge 2 ]]; then
    message="$2"
  fi

  if [[ $# -ge 3 ]]; then
    ignore="$3"
  fi

  if [[ "$RG_AVAILABLE" == "yes" ]]; then
    for dir in "${TARGET_DIRS[@]}"; do
      if [[ -d "$dir" ]]; then
        if ! result=$(rg --hidden --glob '!.git/' --glob '!node_modules/' --glob '!frontend-ops/.next/' "$pattern" "$dir" || true); then
          result=""
        fi
        matches+=$'\n'"$result"
      fi
    done
  else
    for dir in "${TARGET_DIRS[@]}"; do
      if [[ -d "$dir" ]]; then
        if ! result=$(grep -RIn --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='.next' -E "$pattern" "$dir" || true); then
          result=""
        fi
        matches+=$'\n'"$result"
      fi
    done
  fi

  matches=$(echo "$matches" | sed '/^[[:space:]]*$/d')

  if [[ -n "$ignore" ]]; then
    matches=$(echo "$matches" | grep -Ev "$ignore" || true)
  fi

  if [[ -n "${matches}" ]]; then
    if [[ -n "${message:-}" ]]; then
      echo "⚠️  ${message:-문제가 발견되었습니다.}"
    else
      echo "⚠️  문제가 발견되었습니다."
    fi
    echo "$matches"
    echo ""
    issues=$((issues + 1))
  else
    if [[ -n "${message:-}" ]]; then
      echo "✅ ${message:-검사 통과}"
    else
      echo "✅ 검사 통과"
    fi
  fi
}

# 1. JS/TS/Java 내 하드코딩된 API URL 또는 토큰 패턴 검사
run_grep 'https?://[^"]+' "API URL이 코드에 직접 하드코딩됐는지 확인하세요. 환경변수/상수로 분리 필요."
run_grep 'Bearer [A-Za-z0-9\-_\.]+' "Bearer 토큰이 코드에 하드코딩되어 있습니다. 절대 금지!"

# 2. JS/TS/React에서 magic number 경고 (0,1,-1 제외)
run_grep '=\s*[2-9][0-9]*\b|=\s*[-]?[1-9][0-9]+' "숫자 리터럴이 직접 사용된 코드가 있습니다. constants 모듈로 분리하세요." '@Column|precision|scale|HTTP_STATUS'

# 3. Java에서 magic number 검사 (switch/case 제외 기본)
run_grep '\b(int|long|double|float)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[2-9][0-9]*' "Java 코드에 하드코딩된 숫자 리터럴이 있습니다. 상수(static final)로 분리하세요." '@Column|precision|scale'

# 4. CSS에서 색상 코드 하드코딩 검사 (디자인 변수 사용 권장)
run_grep '#[0-9a-fA-F]{6}' "CSS에 직접 hex 색상이 사용되었습니다. CSS 변수/토큰을 사용하세요."

if [[ $issues -eq 0 ]]; then
  echo "✅ 하드코딩 및 상수화 점검 통과"
else
  echo "❌ 하드코딩/상수화 문제가 발견되었습니다. 위 경고를 해결해주세요."
  exit 1
fi

