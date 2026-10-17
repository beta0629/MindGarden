#!/usr/bin/env bash
# public-health-check.sh / check-server-clock-skew.sh / check-flyway-schema-health.sh 자가 테스트
# (네트워크: 127.0.0.1 임시 HTTP 서버만 · Flyway 는 mock mysql).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
HEALTH="$DIR/public-health-check.sh"
SKEW="$DIR/check-server-clock-skew.sh"
FLYWAY="$DIR/check-flyway-schema-health.sh"
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

# --- Flyway 스키마 헬스 (mock mysql) ---
MOCK_DIR="$(mktemp -d)"
cleanup_deploy_checks() {
  rm -rf "$MOCK_DIR"
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "${WWW:-}"
}
trap cleanup_deploy_checks EXIT

write_mock_mysql() {
  local mode="$1"
  cat > "$MOCK_DIR/mysql" <<EOF
#!/usr/bin/env bash
# mock mysql — mode=${mode}
set -euo pipefail
sql=""
prev=""
for a in "\$@"; do
  if [ "\$prev" = "-e" ]; then sql="\$a"; fi
  prev="\$a"
done
case "${mode}" in
  connect_fail)
    echo "ERROR 2003 (HY000): Can't connect to MySQL server on '127.0.0.1:3306' (111)" >&2
    exit 1
    ;;
  no_table)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *"information_schema.tables"*|*"table_name = 'flyway_schema_history'"*) echo "0"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
    ;;
  success_zero)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *"information_schema.tables"*|*"table_name = 'flyway_schema_history'"*) echo "1"; exit 0 ;;
      *"success = 0"*"COUNT"*|*"WHERE success = 0;"*) echo "2"; exit 0 ;;
      *"WHERE success = 0 ORDER"*) echo -e "10\\t20261016.001\\tbad\\t0\\t2026-10-16"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
    ;;
  healthy)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *"information_schema.tables"*|*"table_name = 'flyway_schema_history'"*) echo "1"; exit 0 ;;
      *"WHERE success = 0;"*) echo "0"; exit 0 ;;
      *"ORDER BY installed_rank DESC LIMIT"*) echo -e "20261016.002\\t1\\n20261016.001\\t1"; exit 0 ;;
      *"version = '20261016.001'"*|*"20261016_001"*|*"version = '20261016.002'"*|*"20261016_002"*) echo "1"; exit 0 ;;
      *"information_schema.columns"*|*"verify_unknown_exhausted_last_polled_at"*) echo "1"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
    ;;
  underscore_script)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *"information_schema.tables"*|*"table_name = 'flyway_schema_history'"*) echo "1"; exit 0 ;;
      *"WHERE success = 0;"*) echo "0"; exit 0 ;;
      *"ORDER BY installed_rank DESC LIMIT"*) echo -e "20261016.002\\t1"; exit 0 ;;
      # 점 형태만 있으면 0, underscore script LIKE 가 있으면 1 (V20261016_001 대응)
      *"script LIKE '%20261016_001%'"*|*"script LIKE '%20261016_002%'"*) echo "1"; exit 0 ;;
      *"version = '20261016.001'"*|*"version = '20261016.002'"*) echo "0"; exit 0 ;;
      *"information_schema.columns"*|*"verify_unknown_exhausted_last_polled_at"*) echo "1"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
    ;;
  *)
    echo "unknown mock mode" >&2
    exit 99
    ;;
esac
EOF
  chmod +x "$MOCK_DIR/mysql"
}

FLYWAY_ENV=(
  env
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USERNAME=mindgarden
  DB_PASSWORD=secret-should-never-echo
  DB_NAME=core_solution
  FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql"
)

write_mock_mysql connect_fail
check "Flyway 연결 실패는 비치명(exit 0)" 0 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "연결 실패" || { echo "not ok - 연결 실패 메시지 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "connection_refused_or_unreachable\|ERROR 2003" || { echo "not ok - 오류 클래스/코드 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "secret-should-never-echo" && { echo "not ok - 비밀번호가 로그에 노출됨"; fail=1; }
echo "$LAST_OUT" | grep -q -- "-p\*\*\*" || { echo "not ok - -p*** 마스킹 없음"; fail=1; }

write_mock_mysql no_table
check "Flyway 테이블 없음은 비치명(exit 0)" 0 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "테이블 없음" || { echo "not ok - 테이블 없음 메시지 없음"; fail=1; }

write_mock_mysql success_zero
check "Flyway success=0 은 치명(exit 1)" 1 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "success=0" || { echo "not ok - success=0 메시지 없음"; fail=1; }

write_mock_mysql healthy
check "Flyway 정상은 통과(exit 0)" 0 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.001" || { echo "not ok - version 001 미확인"; fail=1; }
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.002" || { echo "not ok - version 002 미확인"; fail=1; }
echo "$LAST_OUT" | grep -q "verify_unknown_exhausted_last_polled_at" || { echo "not ok - 컬럼 검사 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "secret-should-never-echo" && { echo "not ok - healthy 경로 비밀번호 노출"; fail=1; }

write_mock_mysql underscore_script
check "Flyway script underscore(V20261016_001) 폴백 매치" 0 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.001" || { echo "not ok - underscore 폴백 001 미확인"; fail=1; }
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.002" || { echo "not ok - underscore 폴백 002 미확인"; fail=1; }

check "Flyway 잘못된 version 형식은 skip" 0 \
  env DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=mindgarden DB_PASSWORD=secret \
  DB_NAME=core_solution FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  FLYWAY_HEALTH_REQUIRED_VERSIONS="20261016.001,bad;drop,20261016.002" \
  bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "형식 거부(skip): bad;drop" || { echo "not ok - 잘못된 version skip 메시지 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.001" || { echo "not ok - skip 후 정상 version 미확인"; fail=1; }

exit "$fail"
