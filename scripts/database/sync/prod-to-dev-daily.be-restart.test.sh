#!/usr/bin/env bash
# prod-to-dev-daily.sh 의 .dev BE 재기동 헬퍼 단위 테스트 (root/네트워크/systemd 불필요)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
SYNC_SH="$DIR/prod-to-dev-daily.sh"
fail=0

fail_msg() {
  echo "not ok - $*" >&2
  fail=1
}

ok() {
  echo "ok - $*"
}

WORK="$(mktemp -d "${TMPDIR:-/tmp}/mg-be-restart-test.XXXXXX")"
# shellcheck disable=SC2317
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

BIN="$WORK/bin"
mkdir -p "$BIN"
MARKER="$WORK/systemctl.calls"
LOG_FILE="$WORK/sync.log"
: >"$MARKER"
: >"$LOG_FILE"

# mock systemctl: 호출을 마커에 기록
cat >"$BIN/mock-systemctl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
MARKER_FILE="${MOCK_SYSTEMCTL_MARKER:?}"
printf '%s\n' "$*" >>"$MARKER_FILE"
if [[ "${1:-}" == "restart" ]]; then
  exit "${MOCK_SYSTEMCTL_RESTART_RC:-0}"
fi
exit 0
EOF
chmod +x "$BIN/mock-systemctl"

# mock curl: URL 별 HTTP 코드·본문 (prod-to-dev-daily.sh 호출 형태만 지원)
# health: -o /dev/null -w %{http_code}  → stdout 에 코드만
# flyway: -o - -w \n%{http_code}       → body + \n + 코드
cat >"$BIN/mock-curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
url="${*: -1}"
want_body_stdout=0
for a in "$@"; do
  if [[ "$a" == "-" ]]; then
    want_body_stdout=1
  fi
done

code="000"
body=""
case "$url" in
  *'/actuator/health'*)
    code="${MOCK_CURL_HEALTH_CODE:-200}"
    if [[ -n "${MOCK_CURL_HEALTH_BODY:-}" ]]; then
      body="$MOCK_CURL_HEALTH_BODY"
    else
      body='{"status":"UP"}'
    fi
    ;;
  *'/actuator/flyway'*)
    code="${MOCK_CURL_FLYWAY_CODE:-200}"
    # ${VAR:-{...}} 는 기본값의 } 에서 확장이 끊기므로 if 로 분기
    if [[ -n "${MOCK_CURL_FLYWAY_BODY:-}" ]]; then
      body="$MOCK_CURL_FLYWAY_BODY"
    else
      body='{"migrations":[]}'
    fi
    ;;
  *)
    code="${MOCK_CURL_OTHER_CODE:-404}"
    body=""
    ;;
esac

if [[ "$want_body_stdout" == "1" ]]; then
  printf '%s\n%s' "$body" "$code"
else
  printf '%s' "$code"
fi
exit 0
EOF
chmod +x "$BIN/mock-curl"

# 함수 로드
# shellcheck source=prod-to-dev-daily.sh
export PROD_TO_DEV_DAILY_LIB_ONLY=1
# shellcheck disable=SC1090
source "$SYNC_SH"

export MOCK_SYSTEMCTL_MARKER="$MARKER"
export SYSTEMCTL_BIN="$BIN/mock-systemctl"
export CURL_BIN="$BIN/mock-curl"
export DEV_BE_SYSTEMD_UNIT="mindgarden-dev.service"
export DEV_BE_HEALTH_URL="http://127.0.0.1:8080/actuator/health"
export DEV_BE_HEALTH_TIMEOUT_SEC=3
export DEV_BE_HEALTH_INTERVAL_SEC=1
export LOG_FILE

# --- 1) 성공 경로: 재기동 1회 + health 200 ---
: >"$MARKER"
export POST_SYNC_RESTART_DEV_BE=1
export MOCK_CURL_HEALTH_CODE=200
export MOCK_CURL_FLYWAY_CODE=200
export MOCK_CURL_FLYWAY_BODY='{"contexts":{"application":{"flywayBeans":{"flyway":{"migrations":[{"state":"APPLIED"},{"state":"PENDING"}]}}}}}'
out="$(restart_dev_backend_after_successful_sync 2>&1)" || {
  fail_msg "성공 경로 exit non-zero: $out"
  out=""
}
calls="$(grep -c . "$MARKER" || true)"
if [[ "$calls" == "1" ]] && grep -q 'restart mindgarden-dev.service' "$MARKER"; then
  ok "성공 경로 systemctl restart 1회"
else
  fail_msg "성공 경로 systemctl 호출 이상 (calls=$calls): $(cat "$MARKER")"
fi
if printf '%s\n' "$out" | grep -q '재기동 완료'; then
  ok "성공 경로 완료 로그"
else
  fail_msg "성공 경로 완료 로그 없음: $out"
fi
if printf '%s\n' "$out" | grep -qF "$LOG_FILE"; then
  ok "성공 경로 로그 파일 경로 명시"
else
  fail_msg "성공 경로 LOG_FILE 경로 없음"
fi
if printf '%s\n' "$out" | grep -q 'PENDING count=1'; then
  ok "Flyway PENDING 파싱"
else
  fail_msg "Flyway PENDING 파싱 실패: $out"
fi

# --- 2) 헬스 실패 → non-zero ---
: >"$MARKER"
export MOCK_CURL_HEALTH_CODE=503
set +e
out="$(restart_dev_backend_after_successful_sync 2>&1)"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  ok "헬스 실패 시 non-zero (rc=$rc)"
else
  fail_msg "헬스 실패인데 exit 0: $out"
fi
if printf '%s\n' "$out" | grep -qi 'health timeout\|ERROR'; then
  ok "헬스 실패 에러 메시지"
else
  fail_msg "헬스 실패 메시지 없음: $out"
fi

# --- 3) POST_SYNC_RESTART_DEV_BE=0 skip ---
: >"$MARKER"
export POST_SYNC_RESTART_DEV_BE=0
export MOCK_CURL_HEALTH_CODE=200
out="$(restart_dev_backend_after_successful_sync 2>&1)" || {
  fail_msg "skip 경로 exit non-zero: $out"
  out=""
}
calls="$(grep -c . "$MARKER" || true)"
if [[ "$calls" == "0" ]]; then
  ok "POST_SYNC_RESTART_DEV_BE=0 이면 systemctl 0회"
else
  fail_msg "skip 인데 systemctl 호출됨: $(cat "$MARKER")"
fi
if printf '%s\n' "$out" | grep -q '재기동 skip'; then
  ok "skip 로그"
else
  fail_msg "skip 로그 없음: $out"
fi

# --- 4) 동기화 실패(early die) 시 재기동 안 함 ---
: >"$MARKER"
export POST_SYNC_RESTART_DEV_BE=1
export MOCK_CURL_HEALTH_CODE=200
set +e
(
  set -euo pipefail
  # 동기화 단계 실패 stub — set -e 로 이후 restart 미도달
  die "stub sync failed before restart"
  restart_dev_backend_after_successful_sync
) >"$WORK/fail-flow.out" 2>&1
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  ok "동기화 실패 stub non-zero"
else
  fail_msg "동기화 실패 stub 가 exit 0"
fi
calls="$(grep -c . "$MARKER" || true)"
if [[ "$calls" == "0" ]]; then
  ok "동기화 실패 시 systemctl 0회"
else
  fail_msg "동기화 실패인데 systemctl 호출됨: $(cat "$MARKER")"
fi

# --- 5) 본문 호출 순서: redeploy 성공 후 · 완료 로그 직전 ---
if awk '
  /redeploy_dev_procedures_from_repo$/ { redeploy_call=NR }
  /restart_dev_backend_after_successful_sync$/ { restart_call=NR }
  /=== 완료:/ { done_log=NR }
  END {
    if (redeploy_call && restart_call && done_log \
        && redeploy_call < restart_call && restart_call < done_log) exit 0
    exit 1
  }
' "$SYNC_SH"; then
  ok "호출 순서: redeploy → restart → 완료 로그"
else
  fail_msg "본문 호출 순서 불일치"
fi

if [[ "$fail" -eq 0 ]]; then
  echo "PASS prod-to-dev-daily.be-restart"
  exit 0
fi
echo "FAIL prod-to-dev-daily.be-restart" >&2
exit 1
