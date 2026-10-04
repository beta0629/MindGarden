#!/usr/bin/env bash
# 가드레일 3a — 새 커밋(BASE..HEAD)만 gitleaks 로 검사한다. 비밀값은 출력하지 않는다(--redact=100).
# 기존 히스토리 발견분은 저장소 루트 .gitleaksignore (fingerprint 만, 값 없음) 로 제외된다.
# 사용: scripts/ci/guardrail-gitleaks-diff.sh <base-sha|ref> [head-sha|ref]
set -euo pipefail

BASE_REF="${1:?base sha/ref 필요}"
HEAD_REF="${2:-HEAD}"
REPORT="${GITLEAKS_REPORT:-${RUNNER_TEMP:-/tmp}/guardrail-gitleaks.json}"

command -v gitleaks >/dev/null || { echo "::error::gitleaks 미설치 — https://github.com/gitleaks/gitleaks 설치 후 재실행"; exit 2; }
command -v jq >/dev/null || { echo "::error::jq 미설치"; exit 2; }

BASE_SHA=$(git merge-base "$BASE_REF" "$HEAD_REF")
COUNT=$(git rev-list --no-merges --count "$BASE_SHA..$HEAD_REF")
echo "gitleaks diff: $BASE_SHA..$HEAD_REF (non-merge commits: $COUNT)"
if [ "$COUNT" = "0" ]; then
  echo "OK: 검사할 새 커밋 없음"
  exit 0
fi

set +e
gitleaks git --no-banner --redact=100 --log-level warn \
  --log-opts="--no-merges $BASE_SHA..$HEAD_REF" \
  --report-format json --report-path "$REPORT" .
rc=$?
set -e

if [ "$rc" = "0" ]; then
  echo "OK: 새 커밋에서 비밀값 발견 없음"
  exit 0
fi
if [ ! -s "$REPORT" ]; then
  echo "::error::gitleaks 실행 실패(exit $rc) — 로그를 확인하세요"
  exit "$rc"
fi
jq -r '.[] | "::error file=\(.File),line=\(.StartLine)::비밀값 의심(\(.RuleID)) \(.File):\(.StartLine) commit \(.Commit[0:12]) — 값을 커밋에서 제거(히스토리 재작성 또는 키 회전)하고 env/Secrets 로 주입하세요. 오탐이면 .gitleaksignore 에 fingerprint \(.Fingerprint) 추가(사유는 PR 본문)"' "$REPORT"
echo "FAIL: $(jq length "$REPORT")건"
exit 1
