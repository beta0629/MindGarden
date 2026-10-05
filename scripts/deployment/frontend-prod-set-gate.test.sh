#!/bin/bash
# frontend-prod-set-gate.sh: 서버 run 없음/성공/실패/대기 후 성공/tip 앞섬/gh 실패 를 stub 으로 검사한다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
GATE="$ROOT/scripts/deployment/frontend-prod-set-gate.sh"
WORKDIR=$(mktemp -d "${TMPDIR:-/tmp}/mg-set-gate-test.XXXXXX")
trap 'rm -rf "$WORKDIR"' EXIT
SHA=$(printf 'a%.0s' $(seq 1 40))
OTHER=$(printf 'b%.0s' $(seq 1 40))

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

bash -n "$GATE"
mkdir -p "$WORKDIR/bin"
# gh stub: SET_GATE_TEST_RUNS 파일의 줄을 호출마다 하나씩 소비한다(마지막 줄은 반복). "ERR" 이면 실패.
cat >"$WORKDIR/bin/gh" <<'EOF'
#!/bin/bash
f="${SET_GATE_TEST_RUNS:?}"
c="${SET_GATE_TEST_COUNTER:?}"
n=$(( $(cat "$c" 2>/dev/null || echo 0) + 1 ))
echo "$n" >"$c"
total=$(wc -l <"$f" | tr -d ' ')
[ "$n" -le "$total" ] || n="$total"
line=$(sed -n "${n}p" "$f")
[ "$line" = "ERR" ] && exit 1
[ "$line" = "NONE" ] && exit 0
echo "$line"
EOF
# git stub: ls-remote → tip, fetch → 성공, diff → SET_GATE_TEST_FE_DIFF(0 같음 / 1 다름 / 그 외 오류)
cat >"$WORKDIR/bin/git" <<'EOF'
#!/bin/bash
case "$1" in
    ls-remote) printf '%s\trefs/heads/release/prod\n' "${SET_GATE_TEST_TIP:?}" ;;
    fetch) exit 0 ;;
    diff) exit "${SET_GATE_TEST_FE_DIFF:-1}" ;;
    *) exit 2 ;;
esac
EOF
chmod +x "$WORKDIR/bin/gh" "$WORKDIR/bin/git"

run_gate() {
    local runs="$1" tip="$2"
    printf '%s\n' "$runs" >"$WORKDIR/runs"
    : >"$WORKDIR/counter"
    : >"$WORKDIR/out"
    PATH="$WORKDIR/bin:$PATH" \
        SET_GATE_TEST_RUNS="$WORKDIR/runs" SET_GATE_TEST_COUNTER="$WORKDIR/counter" SET_GATE_TEST_TIP="$tip" \
        DEPLOY_SHA="$SHA" GITHUB_REPOSITORY="owner/repo" GITHUB_OUTPUT="$WORKDIR/out" \
        SET_GATE_APPEAR_TRIES=2 SET_GATE_APPEAR_INTERVAL=0 SET_GATE_POLL_INTERVAL=0.2 SET_GATE_MAX_WAIT_SECONDS=2 \
        bash "$GATE" 2>&1
}

out=$(run_gate "NONE" "$SHA") || fail "no backend run should pass: $out"
grep -q '^deploy=true$' "$WORKDIR/out" || fail "no backend run: deploy=true expected"
[ "$(cat "$WORKDIR/counter")" = "2" ] || fail "appear window not polled twice"

out=$(run_gate "11 completed success" "$SHA") || fail "backend success should pass: $out"
grep -q '^deploy=true$' "$WORKDIR/out" || fail "backend success: deploy=true expected"

out=$(run_gate $'11 queued \n11 in_progress \n11 completed success' "$SHA") || fail "wait then success should pass: $out"
grep -q '^deploy=true$' "$WORKDIR/out" || fail "wait then success: deploy=true expected"

if out=$(run_gate "11 completed failure" "$SHA"); then
    fail "backend failure must block the frontend: $out"
fi
[ ! -s "$WORKDIR/out" ] || fail "backend failure wrote an output"

if out=$(run_gate "11 completed cancelled" "$SHA"); then
    fail "backend cancelled must block the frontend: $out"
fi

if out=$(run_gate "11 in_progress " "$SHA"); then
    fail "backend still running past max wait must block: $out"
fi

if out=$(run_gate "ERR" "$SHA"); then
    fail "gh failure must block the frontend: $out"
fi

out=$(run_gate "11 completed success" "$OTHER") || fail "tip ahead should exit 0: $out"
grep -q '^deploy=false$' "$WORKDIR/out" || fail "tip ahead: deploy=false expected"
grep -q '^reason=tip-ahead$' "$WORKDIR/out" || fail "tip ahead reason missing"

out=$(SET_GATE_TEST_FE_DIFF=0 run_gate "11 completed success" "$OTHER") || fail "tip ahead without FE diff should pass: $out"
grep -q '^deploy=true$' "$WORKDIR/out" || fail "tip ahead without FE diff: deploy=true expected (later BE-only push makes no FE run)"

if out=$(SET_GATE_TEST_FE_DIFF=128 run_gate "11 completed success" "$OTHER"); then
    fail "FE diff error must block the frontend: $out"
fi

if PATH="$WORKDIR/bin:$PATH" DEPLOY_SHA="not-a-sha" GITHUB_REPOSITORY="owner/repo" GITHUB_OUTPUT="$WORKDIR/out" \
    bash "$GATE" >/dev/null 2>&1; then
    fail "invalid SHA must be refused"
fi

echo "frontend-prod-set-gate.test.sh PASS"
