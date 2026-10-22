#!/usr/bin/env bash
# 운영 데이터 보정 워크플로 정적 검사.
#  1) 운영 DB 시크릿과 쓰기 확인값(REPAIR_CONFIRM / INCOME_CANCEL_CONFIRM)을 같이 쓰는 잡은
#     job if 에 github.event_name == 'workflow_dispatch' 가 있고 environment 가 production-data-fix 여야 한다.
#  2) 그런 잡이 있는 워크플로의 on: 에는 workflow_dispatch 외 트리거가 없어야 한다.
# 인자: 워크플로 파일들. 없으면 .github/workflows/*.yml 전부.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ "$#" -eq 0 ]; then
  set -- "${ROOT}"/.github/workflows/*.yml
fi

fail=0
for wf in "$@"; do
  out="$(awk '
    function flush() {
      if (job != "" && uses_prod && writes) {
        found = 1
        if (job_if !~ /github\.event_name == .workflow_dispatch./) {
          print "FAIL job " job ": write job without a workflow_dispatch if"
        }
        if (job_env != "production-data-fix") {
          print "FAIL job " job ": write job environment is \"" job_env "\", not production-data-fix"
        }
      }
      job = ""; job_if = ""; job_env = ""; uses_prod = 0; writes = 0
    }
    /^on:/ { section = "on"; next }
    /^jobs:/ { section = "jobs"; next }
    /^[^ #]/ { flush(); section = "other"; next }
    section == "on" && /^  [A-Za-z_]+:/ {
      t = $1; sub(":", "", t)
      if (t != "workflow_dispatch") { triggers = triggers " " t }
      next
    }
    section == "jobs" && /^  [A-Za-z0-9_-]+:[[:space:]]*$/ {
      flush(); job = $1; sub(":", "", job); next
    }
    section == "jobs" && job != "" && /^    if:/ { job_if = $0; next }
    section == "jobs" && job != "" && /^    environment:/ { job_env = $2; next }
    section == "jobs" && job != "" && /secrets\.PRODUCTION_DB_/ { uses_prod = 1 }
    section == "jobs" && job != "" && /(REPAIR_CONFIRM|INCOME_CANCEL_CONFIRM):/ { writes = 1 }
    END {
      flush()
      if (found && triggers != "") { print "FAIL workflow has non-dispatch triggers:" triggers }
      if (found) { print "checked write jobs" }
    }
  ' "$wf")"
  if printf '%s\n' "$out" | grep -q '^FAIL'; then
    printf '%s: %s\n' "${wf#"${ROOT}"/}" "$out" | grep FAIL >&2
    fail=1
  elif printf '%s\n' "$out" | grep -q 'checked write jobs'; then
    echo "OK ${wf#"${ROOT}"/}"
  fi
done
[ "$fail" -eq 0 ] || { echo "::error::production data-fix write path is reachable outside workflow_dispatch" >&2; exit 1; }
echo "prod data-fix dispatch-only check passed"
