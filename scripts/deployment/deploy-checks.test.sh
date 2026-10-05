#!/usr/bin/env bash
# public-health-check.sh / check-server-clock-skew.sh 자가 테스트 (네트워크: 127.0.0.1 임시 HTTP 서버만).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
HEALTH="$DIR/public-health-check.sh"
SKEW="$DIR/check-server-clock-skew.sh"
fail=0

check() {
  local name="$1" expected="$2"
  shift 2
  local out code=0
  out="$("$@" 2>&1)" || code=$?
  if [ "$code" = "$expected" ]; then
    echo "ok - $name"
  else
    echo "not ok - $name (exit $code, expected $expected)"
    printf '    %s\n' "${out//$'\n'/$'\n'    }"
    fail=1
  fi
  LAST_OUT="$out"
}

# --- clock skew 판정 ---
check "시간 차이 기준 이내는 OK" 0 bash "$SKEW" --evaluate 1000 990 1010
echo "$LAST_OUT" | grep -q "CLOCK_SKEW_RESULT=OK" || { echo "not ok - OK 표시 없음"; fail=1; }
check "기준 초과는 경고만(exit 0)" 0 bash "$SKEW" --evaluate 1100 990 1010
echo "$LAST_OUT" | grep -q "CLOCK_SKEW_RESULT=WARN" || { echo "not ok - WARN 표시 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "::warning title=" || { echo "not ok - ::warning 없음"; fail=1; }
check "서버가 느린 경우도 절댓값으로 판정" 0 bash "$SKEW" --evaluate 900 990 1010
echo "$LAST_OUT" | grep -q "CLOCK_SKEW_RESULT=WARN" || { echo "not ok - 음수 차이 WARN 없음"; fail=1; }
check "기준값은 환경변수로 바꾼다" 0 env CLOCK_SKEW_WARN_SECONDS=200 bash "$SKEW" --evaluate 1100 990 1010
echo "$LAST_OUT" | grep -q "CLOCK_SKEW_RESULT=OK" || { echo "not ok - 기준 env 미반영"; fail=1; }
check "숫자가 아닌 서버 응답은 실패" 1 bash "$SKEW" --evaluate "" 990 1010
check "SSH 정보 없으면 실패" 1 env -u CLOCK_SKEW_SSH_HOST bash "$SKEW"

# --- 공개 URL 헬스 ---
check "공개 URL 비어 있으면 실패" 1 bash "$HEALTH" ""

if command -v python3 >/dev/null 2>&1; then
  WWW="$(mktemp -d)"
  mkdir -p "$WWW/up/actuator" "$WWW/down/actuator"
  printf '{"status":"UP"}' > "$WWW/up/actuator/health"
  printf '{"status":"DOWN"}' > "$WWW/down/actuator/health"
  PORT="$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')"
  (cd "$WWW" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1) &
  SERVER_PID=$!
  disown "$SERVER_PID"
  trap 'kill "$SERVER_PID" 2>/dev/null; rm -rf "$WWW"' EXIT
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
    sleep 0.3
  done
  export PUBLIC_HEALTH_ATTEMPTS=2 PUBLIC_HEALTH_INTERVAL_SEC=0
  check "200·UP 은 통과" 0 bash "$HEALTH" "http://127.0.0.1:$PORT/up/"
  check "200 이어도 DOWN 이면 실패" 1 bash "$HEALTH" "http://127.0.0.1:$PORT/down"
  check "404 는 실패" 1 bash "$HEALTH" "http://127.0.0.1:$PORT/missing"
  check "연결 안 되면 실패" 1 bash "$HEALTH" "http://127.0.0.1:1"
else
  echo "skip - python3 없음: HTTP 케이스 생략"
fi

exit "$fail"
