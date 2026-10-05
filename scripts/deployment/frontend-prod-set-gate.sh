#!/bin/bash
# 운영 화면(프론트)·서버(백엔드) 같은 SHA 세트 게이트. deploy-frontend-prod.yml 이 업로드 직전에 부른다.
#   1) 같은 SHA 의 서버 워크플로 run 이 있으면 끝날 때까지 기다린다. success 가 아니면 exit 1 (화면이 서버보다 앞서지 않게).
#   2) 서버 run 이 없으면(프론트만 바뀐 push) 바로 다음 단계.
#   3) 배포 브랜치 tip 이 DEPLOY_SHA 와 다르면 deploy=false (옛 빌드로 덮지 않음. 최신 SHA 의 run 이 올린다).
# 결과: GITHUB_OUTPUT 에 deploy=true|false, reason=...
#
# 필요 env: DEPLOY_SHA, GH_TOKEN(Actions 읽기), GITHUB_REPOSITORY
# 선택 env: SET_GATE_BACKEND_WORKFLOW, SET_GATE_BRANCH, SET_GATE_APPEAR_TRIES, SET_GATE_APPEAR_INTERVAL,
#           SET_GATE_POLL_INTERVAL, SET_GATE_MAX_WAIT_SECONDS
set -euo pipefail

BACKEND_WORKFLOW="${SET_GATE_BACKEND_WORKFLOW:-deploy-production.yml}"
BRANCH="${SET_GATE_BRANCH:-release/prod}"
APPEAR_TRIES="${SET_GATE_APPEAR_TRIES:-3}"
APPEAR_INTERVAL="${SET_GATE_APPEAR_INTERVAL:-20}"
POLL_INTERVAL="${SET_GATE_POLL_INTERVAL:-30}"
MAX_WAIT="${SET_GATE_MAX_WAIT_SECONDS:-4800}"
OUT="${GITHUB_OUTPUT:-/dev/stdout}"

fail() {
    echo "::error::$*"
    exit 1
}

emit() {
    printf 'deploy=%s\nreason=%s\n' "$1" "$2" >>"$OUT"
    echo "set-gate: deploy=$1 reason=$2"
}

[ -n "${DEPLOY_SHA:-}" ] || fail "DEPLOY_SHA 가 비어 있습니다."
[ -n "${GITHUB_REPOSITORY:-}" ] || fail "GITHUB_REPOSITORY 가 비어 있습니다."
case "$DEPLOY_SHA" in
    *[!0-9a-f]*) fail "DEPLOY_SHA 형식이 아닙니다." ;;
esac
[ "${#DEPLOY_SHA}" -eq 40 ] || fail "DEPLOY_SHA 는 40자 SHA 여야 합니다."

# 가장 최근 run 한 건: "<id> <status> <conclusion>" (없으면 빈 줄)
latest_backend_run() {
    gh run list --repo "$GITHUB_REPOSITORY" --workflow "$BACKEND_WORKFLOW" --commit "$DEPLOY_SHA" \
        --limit 20 --json databaseId,status,conclusion,createdAt,headSha \
        --jq "[.[] | select(.headSha == \"$DEPLOY_SHA\")] | sort_by(.createdAt) | reverse | .[0] // empty | \"\(.databaseId) \(.status) \(.conclusion)\""
}

run_line=""
for attempt in $(seq 1 "$APPEAR_TRIES"); do
    run_line=$(latest_backend_run) || fail "서버 워크플로 run 목록을 읽지 못했습니다. 화면을 올리지 않습니다."
    [ -n "$run_line" ] && break
    [ "$attempt" -lt "$APPEAR_TRIES" ] && sleep "$APPEAR_INTERVAL"
done

if [ -z "$run_line" ]; then
    echo "같은 SHA 의 $BACKEND_WORKFLOW run 이 없습니다(서버 변경 없음). 화면만 진행합니다."
else
    started=$SECONDS
    while :; do
        read -r run_id run_status run_conclusion <<<"$run_line"
        echo "서버 run id=$run_id status=$run_status conclusion=${run_conclusion:-}"
        if [ "$run_status" = "completed" ]; then
            [ "$run_conclusion" = "success" ] \
                || fail "같은 SHA 의 서버 배포가 성공하지 않았습니다(conclusion=$run_conclusion). 화면을 올리지 않습니다."
            break
        fi
        [ $((SECONDS - started)) -lt "$MAX_WAIT" ] || fail "서버 배포 대기 시간(${MAX_WAIT}s)을 넘었습니다. 화면을 올리지 않습니다."
        sleep "$POLL_INTERVAL"
        run_line=$(latest_backend_run) || fail "서버 워크플로 run 목록을 읽지 못했습니다. 화면을 올리지 않습니다."
        [ -n "$run_line" ] || fail "서버 run 이 목록에서 사라졌습니다. 화면을 올리지 않습니다."
    done
fi

tip=$(git ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}') || fail "$BRANCH tip 을 읽지 못했습니다."
[ -n "$tip" ] || fail "$BRANCH tip 을 읽지 못했습니다."
if [ "$tip" != "$DEPLOY_SHA" ]; then
    echo "::warning::$BRANCH tip 이 앞서 나갔습니다. 옛 화면으로 덮지 않습니다(최신 SHA 의 run 이 올립니다)."
    emit false tip-ahead
    exit 0
fi
emit true same-sha-set
