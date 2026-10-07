#!/usr/bin/env bash
# Cursor stop 훅 — 에이전트가 끝내기 직전에 "바뀐 영역만" 가드레일 1·2 와 빠른 관련 테스트를 돌린다.
# 실패하면 followup_message 로 실패 내용(한 줄에 하나, 무엇을 고칠지)을 돌려줘 완료를 막는다.
# 안전: maven -o(오프라인), npx 대신 로컬 node_modules 바이너리, 네트워크 쓰기·fetch 없음, 비밀값 마스킹.
# 건너뜀: 변경 없음 · 문서만 변경 · MG_GUARDRAIL_HOOK=off · status!=completed · 시간 초과(경고만, CI 가 최종 게이트).
set -uo pipefail

INPUT=$(cat)
emit() { printf '%s\n' "$1"; exit 0; }
log() { printf '[guardrail-hook] %s\n' "$*" >&2; }

STATUS=$(printf '%s' "$INPUT" | jq -r '.status // "completed"' 2>/dev/null || echo completed)
[ "$STATUS" = "completed" ] || emit '{}'
[ "${MG_GUARDRAIL_HOOK:-on}" = "off" ] && { log "MG_GUARDRAIL_HOOK=off — 건너뜀"; emit '{}'; }

ROOT_HINT=$(printf '%s' "$INPUT" | jq -r '.workspace_roots[0] // empty' 2>/dev/null || true)
cd "${ROOT_HINT:-$PWD}" 2>/dev/null || true
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || { log "git 저장소 아님 — 건너뜀"; emit '{}'; }
cd "$ROOT" || emit '{}'

DEV_BRANCH=$(sed -n 's/^DEV_BRANCH=//p' .cursor/harness.env 2>/dev/null | head -1)
BASE_REF="${GUARDRAIL_BASE:-origin/${DEV_BRANCH:-release/dev}}"
git rev-parse --verify -q "$BASE_REF" >/dev/null || { log "$BASE_REF 없음 — 건너뜀"; emit '{}'; }
MERGE_BASE=$(git merge-base "$BASE_REF" HEAD 2>/dev/null) || emit '{}'
CHANGED=$( { git diff --name-only "$MERGE_BASE"; git ls-files --others --exclude-standard; } | sort -u)
[ -n "$CHANGED" ] || { log "변경 없음 — 건너뜀"; emit '{}'; }

DOCS_RE='(\.md|\.mdc|\.png|\.jpe?g|\.gif|\.svg)$|^docs/|^\.cursor/(rules|skills|agents)/'
CODE=$(printf '%s\n' "$CHANGED" | grep -Ev "$DOCS_RE" || true)
[ -n "$CODE" ] || { log "문서만 변경 — 건너뜀"; emit '{}'; }

MAVEN_TIMEOUT="${GUARDRAIL_MAVEN_TIMEOUT:-200}"
JEST_TIMEOUT="${GUARDRAIL_JEST_TIMEOUT:-80}"
MAX_RELATED="${GUARDRAIL_MAX_RELATED_TESTS:-8}"
LOG_DIR="${TMPDIR:-/tmp}/mg-guardrail-hook"
mkdir -p "$LOG_DIR"
run_with_timeout() { perl -e 'alarm shift; exec @ARGV or exit 127' "$@"; }
redact() { perl -pe 's/((?:password|passwd|secret|token|api[-_]?key|private[-_]?key)[^:=\n]{0,20}[:=]\s*)[^\s,"]+/$1***/gi'; }

# Cloud/agent VMs may ship Maven under ~/.local without PATH — resolve before exec (exit 127 방지).
resolve_mvn() {
  if command -v mvn >/dev/null 2>&1; then
    command -v mvn
    return 0
  fi
  for candidate in \
    "${HOME}/.local/bin/mvn" \
    "${HOME}/.local/apache-maven-3.9.6/bin/mvn" \
    "${HOME}/.sdkman/candidates/maven/current/bin/mvn" \
    /usr/local/bin/mvn \
    /opt/maven/bin/mvn
  do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}
MVN_BIN=$(resolve_mvn) || MVN_BIN=""
if [ -n "$MVN_BIN" ]; then
  export PATH="$(dirname "$MVN_BIN"):${PATH:-/usr/bin:/bin}"
fi

FAILS=""
add_fail() { FAILS="${FAILS}- $1"$'\n'; }

# ---- 백엔드: 가드레일 1·2(+yml) + 바뀐 main 클래스의 관련 테스트
BE_RE='^(src/main/|src/test/|database/schema/procedures_standardized/|pom\.xml$)'
if printf '%s\n' "$CODE" | grep -Eq "$BE_RE"; then
  TESTS="AdminApiGuardCoverageTest,ProcedureSignatureGuardrailTest"
  printf '%s\n' "$CODE" | grep -Eq '(^|/)application[^/]*\.ya?ml$|yml-secret-defaults' \
    && TESTS="$TESTS,ApplicationYmlSecretDefaultsTest"
  RELATED=$(
    {
      printf '%s\n' "$CODE" | grep -E '^src/main/java/.*\.java$' | xargs -n1 basename 2>/dev/null | sed 's/\.java$//' \
        | while read -r c; do [ -n "$c" ] && find src/test/java -name "${c}Test.java" -o -name "${c}*Test.java" 2>/dev/null; done
      printf '%s\n' "$CODE" | grep -E '^src/test/java/.*Test\.java$' | while read -r f; do [ -f "$f" ] && echo "$f"; done
    } | xargs -n1 basename 2>/dev/null | sed 's/\.java$//' | sort -u | head -n "$MAX_RELATED" | paste -sd, -)
  [ -n "$RELATED" ] && TESTS="$TESTS,$RELATED"
  TESTS=$(printf '%s' "$TESTS" | tr ',' '\n' | awk 'NF && !seen[$0]++' | paste -sd, -)
  BE_LOG="$LOG_DIR/maven.log"
  if [ -z "$MVN_BIN" ]; then
    add_fail "maven 없음(exit 127) — PATH에 mvn 설치 또는 ~/.local/apache-maven-*/bin/mvn 확인"
  else
    log "$MVN_BIN -o test -Dtest=$TESTS (timeout ${MAVEN_TIMEOUT}s)"
    START=$(date +%s)
    run_with_timeout "$MAVEN_TIMEOUT" "$MVN_BIN" -o -q -B test -Dtest="$TESTS" -Dsurefire.failIfNoSpecifiedTests=false \
      >"$BE_LOG" 2>&1
    RC=$?
    log "maven exit=$RC ($(( $(date +%s) - START ))s) log=$BE_LOG"
    if [ "$RC" = "142" ]; then
      log "maven 시간 초과 — 차단하지 않음(CI Guardrail BE 가 최종 게이트). 수동: mvn -o test -Dtest=$TESTS"
    elif [ "$RC" != "0" ]; then
      LINES=$( { grep -E '^  - ' "$BE_LOG"; grep -E '^\[ERROR\]   [A-Za-z]' "$BE_LOG" | grep -v 'AdminApiGuardCoverageTest\.\|ProcedureSignatureGuardrailTest\.\|ApplicationYmlSecretDefaultsTest\.'; \
        grep -E '^\[ERROR\] .*\.java:\[[0-9]+' "$BE_LOG"; } | sed -E 's/^  - //; s/^\[ERROR\] +//' | redact | awk '!seen[$0]++' | head -n 30)
      [ -n "$LINES" ] || LINES="maven 실패(exit $RC) — $BE_LOG 확인 후 mvn -o test -Dtest=$TESTS 재실행"
      while IFS= read -r l; do add_fail "$l"; done <<< "$LINES"
    fi
  fi
fi

# ---- 프론트: 바뀐 파일의 관련 jest 만
FE_FILES=$(printf '%s\n' "$CODE" | grep -E '^frontend/src/.*\.(js|jsx|ts|tsx)$' | sed 's#^frontend/##' | while read -r f; do [ -f "frontend/$f" ] && echo "$f"; done)
if [ -n "$FE_FILES" ] && [ -x frontend/node_modules/.bin/craco ]; then
  FE_LOG="$LOG_DIR/jest.log"
  log "jest --findRelatedTests ($(printf '%s\n' "$FE_FILES" | wc -l | tr -d ' ') files, timeout ${JEST_TIMEOUT}s)"
  # shellcheck disable=SC2086
  (cd frontend && CI=true run_with_timeout "$JEST_TIMEOUT" ./node_modules/.bin/craco test --watchAll=false --ci \
    --passWithNoTests --findRelatedTests $FE_FILES) >"$FE_LOG" 2>&1
  RC=$?
  if [ "$RC" = "142" ]; then
    log "jest 시간 초과 — 차단하지 않음"
  elif [ "$RC" != "0" ]; then
    LINES=$(grep -E '^[[:space:]]*● ' "$FE_LOG" | sed -E 's/^[[:space:]]*● //' | redact | awk '!seen[$0]++' | head -n 15)
    [ -n "$LINES" ] || LINES="jest 실패(exit $RC) — $FE_LOG 확인"
    while IFS= read -r l; do add_fail "jest: $l — 테스트 기대값 또는 구현을 고치세요"; done <<< "$LINES"
  fi
fi

if [ -z "$FAILS" ]; then
  log "PASS"
  emit '{}'
fi
MSG="가드레일 훅 FAIL — 완료 전에 아래를 고치고 다시 검증하세요 (전체 로그: $LOG_DIR):"$'\n'"$FAILS"
jq -cn --arg m "$MSG" '{followup_message: $m}'
exit 0
