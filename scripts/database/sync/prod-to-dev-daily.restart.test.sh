#!/bin/bash
# prod-to-dev-daily.sh 의 재기동 단계만 가짜 systemctl/curl 로 확인한다.
# MySQL·systemd·서버에는 접속하지 않는다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
SYNC_SRC="$ROOT/scripts/database/sync/prod-to-dev-daily.sh"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

[ ! -f /etc/mindgarden/prod-to-dev-sync.env ] \
    || fail "실서버 동기화 설정이 있는 머신에서는 실행하지 않습니다."

WORK=$(mktemp -d "${TMPDIR:-/tmp}/mg-sync-restart.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/bin" "$WORK/script" "$WORK/log"
cp "$SYNC_SRC" "$WORK/script/prod-to-dev-daily.sh"
chmod +x "$WORK/script/prod-to-dev-daily.sh"

cat >"$WORK/bin/date" <<'EOF'
#!/bin/bash
if [[ "${1:-}" == "+%H" ]]; then
    printf '%s\n' "${FAKE_HOUR:-3}"
    exit 0
fi
exec /bin/date "$@"
EOF

cat >"$WORK/bin/sudo" <<'EOF'
#!/bin/bash
printf '%s\n' "$*" >> "${SUDO_LOG:?}"
if [[ "${FAKE_SUDO_FAIL:-0}" == "1" ]]; then
    exit 1
fi
if [[ "${1:-}" == "-n" && "${2:-}" == "journalctl" ]]; then
    printf '%s\n' "Flyway: Successfully applied 1 migration"
    exit 0
fi
exit 0
EOF

cat >"$WORK/bin/curl" <<'EOF'
#!/bin/bash
printf '%s\n' "${FAKE_HTTP_CODE:-200}"
exit 0
EOF

chmod +x "$WORK/bin/date" "$WORK/bin/sudo" "$WORK/bin/curl"

write_env() {
    cat >"$WORK/script/prod-to-dev-daily.env" <<EOF
SYNC_MODE=dump_live
NON_INTERACTIVE=1
TMP_DIR=$WORK
LOG_DIR=$WORK/log
PROD_MYSQL_HOST=prod.example
PROD_DB_NAME=mind_garden
PROD_MYSQL_USER=reader
DEV_MYSQL_HOST=dev.example
DEV_DB_NAME=mind_garden_dev
DEV_MYSQL_USER=root
DEV_BACKEND_HEALTH_WAIT_SECONDS=${DEV_BACKEND_HEALTH_WAIT_SECONDS:-2}
DEV_BACKEND_HEALTH_INTERVAL_SECONDS=1
SKIP_BACKEND_RESTART=${SKIP_BACKEND_RESTART:-0}
EOF
}

run_restart() {
    local out="$1"
    shift
    set +e
    env -u SKIP_BACKEND_RESTART \
        PATH="$WORK/bin:/usr/bin:/bin" \
        DEV_BACKEND_TEST_PATH="$WORK/bin" \
        SUDO_LOG="$WORK/sudo.log" \
        FAKE_HOUR="${FAKE_HOUR:-3}" \
        FAKE_SUDO_FAIL="${FAKE_SUDO_FAIL:-0}" \
        FAKE_HTTP_CODE="${FAKE_HTTP_CODE:-200}" \
        "$@" \
        bash "$WORK/script/prod-to-dev-daily.sh" --restart-only >"$out" 2>&1
    local rc=$?
    set -e
    printf '%s\n' "$rc"
}

: >"$WORK/sudo.log"
write_env
rc=$(SKIP_BACKEND_RESTART=0 FAKE_HOUR=3 FAKE_SUDO_FAIL=0 FAKE_HTTP_CODE=200 run_restart "$WORK/ok.out")
[ "$rc" = "0" ] || { cat "$WORK/ok.out" >&2; fail "새벽 재기동·헬스 200 이 실패했습니다 rc=$rc"; }
grep -q 'HTTP 200' "$WORK/ok.out" || fail "헬스 200 로그가 없습니다."
grep -q 'Successfully applied' "$WORK/ok.out" || fail "Flyway 로그 발췌가 없습니다."
grep -q 'systemctl restart mindgarden-dev.service' "$WORK/sudo.log" || fail "systemctl restart 가 호출되지 않았습니다."

: >"$WORK/sudo.log"
SKIP_BACKEND_RESTART=1 write_env
rc=$(SKIP_BACKEND_RESTART=1 FAKE_HOUR=15 run_restart "$WORK/skip.out")
[ "$rc" = "0" ] || { cat "$WORK/skip.out" >&2; fail "SKIP_BACKEND_RESTART=1 이 실패했습니다 rc=$rc"; }
grep -q '재기동을 건너뜁니다' "$WORK/skip.out" || fail "건너뛰기 로그가 없습니다."
[ ! -s "$WORK/sudo.log" ] || fail "건너뛰기인데 sudo 가 호출되었습니다."

: >"$WORK/sudo.log"
write_env
rc=$(SKIP_BACKEND_RESTART=0 FAKE_HOUR=15 run_restart "$WORK/hours.out")
[ "$rc" != "0" ] || fail "운영 시간에 재기동이 성공했습니다."
grep -q '11~20시' "$WORK/hours.out" || { cat "$WORK/hours.out" >&2; fail "운영 시간 거절 메시지가 없습니다."; }
[ ! -s "$WORK/sudo.log" ] || fail "운영 시간인데 sudo 가 호출되었습니다."

: >"$WORK/sudo.log"
write_env
rc=$(SKIP_BACKEND_RESTART=0 FAKE_HOUR=3 FAKE_SUDO_FAIL=1 run_restart "$WORK/restart-fail.out")
[ "$rc" != "0" ] || fail "재기동 실패가 exit 0 입니다."
grep -q '재기동 실패' "$WORK/restart-fail.out" || { cat "$WORK/restart-fail.out" >&2; fail "재기동 실패 로그가 없습니다."; }

: >"$WORK/sudo.log"
DEV_BACKEND_HEALTH_WAIT_SECONDS=1 write_env
rc=$(SKIP_BACKEND_RESTART=0 FAKE_HOUR=3 FAKE_SUDO_FAIL=0 FAKE_HTTP_CODE=503 run_restart "$WORK/health-fail.out")
[ "$rc" != "0" ] || fail "헬스 실패가 exit 0 입니다."
grep -q '헬스 실패' "$WORK/health-fail.out" || { cat "$WORK/health-fail.out" >&2; fail "헬스 실패 로그가 없습니다."; }

cat >"$WORK/script/prod-to-dev-daily.env" <<EOF
SYNC_MODE=dump_live
NON_INTERACTIVE=1
TMP_DIR=$WORK
LOG_DIR=$WORK/log
PROD_MYSQL_HOST=same.example
PROD_DB_NAME=same_db
PROD_MYSQL_USER=reader
DEV_MYSQL_HOST=same.example
DEV_DB_NAME=same_db
DEV_MYSQL_USER=root
EOF
rc=$(SKIP_BACKEND_RESTART=0 FAKE_HOUR=3 run_restart "$WORK/prod-guard.out")
[ "$rc" != "0" ] || fail "운영과 같은 대상에서 재기동이 진행되었습니다."
grep -q '운영과 같습니다' "$WORK/prod-guard.out" || { cat "$WORK/prod-guard.out" >&2; fail "운영 가드 메시지가 없습니다."; }

echo "PASS prod-to-dev-daily.restart"
