#!/usr/bin/env bash
# public-health-check.sh / check-server-clock-skew.sh / check-flyway-schema-health.sh /
# load-deploy-db-env.sh / preflight-deploy-db.sh / mysql-deploy-client.sh 자가 테스트
# (네트워크: 127.0.0.1 임시 HTTP 서버만 · Flyway·preflight 는 mock mysql).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
HEALTH="$DIR/public-health-check.sh"
SKEW="$DIR/check-server-clock-skew.sh"
FLYWAY="$DIR/check-flyway-schema-health.sh"
LOAD_DB="$DIR/load-deploy-db-env.sh"
PREFLIGHT="$DIR/preflight-deploy-db.sh"
MYSQL_CLIENT="$DIR/mysql-deploy-client.sh"
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
HELPER_FIXTURE="$(mktemp -d)"
cleanup_deploy_checks() {
  rm -rf "$MOCK_DIR" "$HELPER_FIXTURE"
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
# -p / --password= CLI 인자 거부 (--defaults-extra-file 또는 MYSQL_PWD 만 허용)
set -euo pipefail
has_defaults_file=0
for a in "\$@"; do
  case "\$a" in
    -p*|--password=*)
      echo "FAIL: password must not be passed as CLI arg: \$a" >&2
      exit 98
      ;;
    --defaults-extra-file=*)
      has_defaults_file=1
      cnf="\${a#--defaults-extra-file=}"
      if [ ! -f "\$cnf" ]; then
        echo "FAIL: defaults-extra-file missing: \$cnf" >&2
        exit 97
      fi
      # 비밀번호 값이 stdout/stderr 에 나오면 안 됨 — 파일 존재·0600 만 확인
      perms=\$(stat -c '%a' "\$cnf" 2>/dev/null || stat -f '%Lp' "\$cnf" 2>/dev/null || echo "")
      if [ -n "\$perms" ] && [ "\$perms" != "600" ]; then
        echo "FAIL: defaults-extra-file perms=\$perms (want 600)" >&2
        exit 96
      fi
      ;;
  esac
done
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
  select1_ok)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
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
      *"script LIKE '%20261016_001%'"*|*"script LIKE '%20261016_002%'"*) echo "1"; exit 0 ;;
      *"version = '20261016.001'"*|*"version = '20261016.002'"*) echo "0"; exit 0 ;;
      *"information_schema.columns"*|*"verify_unknown_exhausted_last_polled_at"*) echo "1"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
    ;;
  missing_version)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *"information_schema.tables"*|*"table_name = 'flyway_schema_history'"*) echo "1"; exit 0 ;;
      *"WHERE success = 0;"*) echo "0"; exit 0 ;;
      *"ORDER BY installed_rank DESC LIMIT"*) echo -e "20260101.001\\t1"; exit 0 ;;
      *"version = '20261016.001'"*|*"20261016_001"*|*"version = '20261016.002'"*|*"20261016_002"*) echo "0"; exit 0 ;;
      *"information_schema.columns"*|*"verify_unknown_exhausted_last_polled_at"*) echo "1"; exit 0 ;;
      *) echo "unexpected sql: \$sql" >&2; exit 2 ;;
    esac
    ;;
  missing_column)
    case "\$sql" in
      *"SELECT 1"*) echo "1"; exit 0 ;;
      *"information_schema.tables"*|*"table_name = 'flyway_schema_history'"*) echo "1"; exit 0 ;;
      *"WHERE success = 0;"*) echo "0"; exit 0 ;;
      *"ORDER BY installed_rank DESC LIMIT"*) echo -e "20261016.002\\t1\\n20261016.001\\t1"; exit 0 ;;
      *"version = '20261016.001'"*|*"20261016_001"*|*"version = '20261016.002'"*|*"20261016_002"*) echo "1"; exit 0 ;;
      *"information_schema.columns"*|*"verify_unknown_exhausted_last_polled_at"*) echo "0"; exit 0 ;;
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
check "Flyway 연결 실패는 치명(exit 1)" 1 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "연결 실패" || { echo "not ok - 연결 실패 메시지 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "connection_refused_or_unreachable\|ERROR 2003" || { echo "not ok - 오류 클래스/코드 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "secret-should-never-echo" && { echo "not ok - 비밀번호가 로그에 노출됨"; fail=1; }
echo "$LAST_OUT" | grep -qE -- '-p[^[:space:]*]|--password=' && { echo "not ok - -p/--password= CLI 사용 흔적"; fail=1; }

write_mock_mysql no_table
check "Flyway 테이블 없음은 치명(exit 1)" 1 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
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
echo "$LAST_OUT" | grep -qE -- '-p[^[:space:]*]|--password=' && { echo "not ok - healthy 경로 -p CLI 흔적"; fail=1; }
echo "$LAST_OUT" | grep -q "defaults-extra-file" || { echo "not ok - defaults-extra-file 사용 로그 없음"; fail=1; }

write_mock_mysql underscore_script
check "Flyway script underscore(V20261016_001) 폴백 매치" 0 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.001" || { echo "not ok - underscore 폴백 001 미확인"; fail=1; }
echo "$LAST_OUT" | grep -q "필수 Flyway version 확인: 20261016.002" || { echo "not ok - underscore 폴백 002 미확인"; fail=1; }

write_mock_mysql missing_version
check "Flyway 필수 version 누락은 치명(exit 1)" 1 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "필수 Flyway version 미확인" || { echo "not ok - version 누락 메시지 없음"; fail=1; }

write_mock_mysql missing_column
check "Flyway 필수 column 누락은 치명(exit 1)" 1 "${FLYWAY_ENV[@]}" bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "필수 컬럼 없음" || { echo "not ok - column 누락 메시지 없음"; fail=1; }

check "Flyway DB env 누락은 치명(exit 1)" 1 \
  env -u DB_HOST -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "누락" || { echo "not ok - DB env 누락 메시지 없음"; fail=1; }

check "Flyway 비밀번호만 비어도 치명(exit 1)" 1 \
  env DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=mindgarden DB_PASSWORD= DB_NAME=core_solution \
  FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  bash "$FLYWAY"

check "Flyway mysql 바이너리 없으면 치명(exit 1)" 1 \
  env DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=mindgarden DB_PASSWORD=secret \
  DB_NAME=core_solution FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/no-such-mysql" \
  bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "mysql 클라이언트 없음" || { echo "not ok - mysql 없음 메시지 없음"; fail=1; }

write_mock_mysql healthy
check "Flyway malformed version 은 치명(exit 1)" 1 \
  env DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=mindgarden DB_PASSWORD=secret \
  DB_NAME=core_solution FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  FLYWAY_HEALTH_REQUIRED_VERSIONS="20261016.001,bad;drop,20261016.002" \
  bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "형식 거부(malformed): bad;drop" || { echo "not ok - malformed version 메시지 없음"; fail=1; }

write_mock_mysql healthy
check "Flyway bare column(table. 접두사 없음) 은 치명(exit 1)" 1 \
  env DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=mindgarden DB_PASSWORD=secret \
  DB_NAME=core_solution FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  FLYWAY_HEALTH_REQUIRED_COLUMN="verify_unknown_exhausted_last_polled_at" \
  bash "$FLYWAY"
echo "$LAST_OUT" | grep -q "bare column" || { echo "not ok - bare column 메시지 없음"; fail=1; }

# --- load-deploy-db-env.sh 단위 테스트 ---
HELPER_ENV_FILE="$HELPER_FIXTURE/test.env"
cat > "$HELPER_ENV_FILE" <<'EOF'
DB_HOST=10.0.0.5
DB_PORT=3307
DB_USERNAME=from_file
DB_PASSWORD=file-secret-never-echo
DB_NAME=from_file_db
OTHER_SECRET=should-not-be-sourced
EOF

cat > "$HELPER_FIXTURE/assert-from-file.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
[ "\$DB_HOST" = "10.0.0.5" ] || { echo "host=\$DB_HOST"; exit 2; }
[ "\$DB_PORT" = "3307" ] || { echo "port=\$DB_PORT"; exit 2; }
[ "\$DB_USERNAME" = "from_file" ] || exit 2
[ "\$DB_PASSWORD" = "file-secret-never-echo" ] || exit 2
[ "\$DB_NAME" = "from_file_db" ] || exit 2
[ -z "\${OTHER_SECRET:-}" ] || { echo "OTHER_SECRET leaked"; exit 2; }
echo helper-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-from-file.sh"
check "load-deploy-db-env: env 파일에서 DB_* 로드" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK \
  -u MG_DEPLOY_SYSTEMD_UNITS \
  MG_DEPLOY_ENV_FILE="$HELPER_ENV_FILE" \
  bash "$HELPER_FIXTURE/assert-from-file.sh"
echo "$LAST_OUT" | grep -q "file-secret-never-echo" && { echo "not ok - helper 로그에 비밀번호 노출"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_status pw=set" || { echo "not ok - helper 키 존재 로그 없음"; fail=1; }
# cred_source 소스 줄에 password 문자열(대소문자 무관) 금지
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - cred_source 줄에 password 문자열 포함"
  fail=1
fi
echo "$LAST_OUT" | grep -q "cred_source pw=test_env" || { echo "not ok - cred_source pw=test_env 없음"; fail=1; }

cat > "$HELPER_FIXTURE/required-missing.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
EOF
chmod +x "$HELPER_FIXTURE/required-missing.sh"
check "load-deploy-db-env: required env 파일 없으면 exit 1" 1 \
  env MG_DEPLOY_ENV_FILE="$HELPER_FIXTURE/missing.env" MG_DEPLOY_ENV_FILE_REQUIRED=1 \
  bash "$HELPER_FIXTURE/required-missing.sh"

HELPER_DEV_ALIASES="$HELPER_FIXTURE/dev-aliases.env"
cat > "$HELPER_DEV_ALIASES" <<'EOF'
DEV_DB_HOST=192.168.1.9
DEV_DB_PORT=3308
DEV_DB_USER=devuser
DEV_DB_PASSWORD=dev-secret-never-echo
DEV_DB_NAME=dev_db
EOF

cat > "$HELPER_FIXTURE/assert-aliases.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
[ "\$DB_HOST" = "192.168.1.9" ] || exit 2
[ "\$DB_PORT" = "3308" ] || exit 2
[ "\$DB_USERNAME" = "devuser" ] || exit 2
[ "\$DB_PASSWORD" = "dev-secret-never-echo" ] || exit 2
[ "\$DB_NAME" = "dev_db" ] || exit 2
echo alias-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-aliases.sh"
check "load-deploy-db-env: DEV_DB_* 별칭 매핑" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK \
  -u MG_DEPLOY_SYSTEMD_UNITS \
  MG_DEPLOY_ENV_FILE="$HELPER_DEV_ALIASES" \
  bash "$HELPER_FIXTURE/assert-aliases.sh"
echo "$LAST_OUT" | grep -q "dev-secret-never-echo" && { echo "not ok - DEV 별칭 비밀번호 노출"; fail=1; }

cat > "$HELPER_FIXTURE/assert-preserve.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
[ "\$DB_HOST" = "keep-host" ] || exit 2
[ "\$DB_USERNAME" = "keep-user" ] || exit 2
[ "\$DB_PASSWORD" = "keep-pass" ] || exit 2
[ "\$DB_NAME" = "keep-db" ] || exit 2
[ "\$DB_PORT" = "3399" ] || exit 2
echo preserve-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-preserve.sh"
check "load-deploy-db-env: 이미 export 된 DB_* 는 덮어쓰지 않음" 0 \
  env DB_HOST=keep-host DB_USERNAME=keep-user DB_PASSWORD=keep-pass DB_NAME=keep-db DB_PORT=3399 \
  MG_DEPLOY_ENV_FILE="$HELPER_ENV_FILE" \
  bash "$HELPER_FIXTURE/assert-preserve.sh"

touch "$HELPER_FIXTURE/empty.env"
cat > "$HELPER_FIXTURE/assert-fallback.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
[ "\$DB_PASSWORD" = "fallback-secret" ] || exit 2
[ "\$DB_HOST" = "127.0.0.1" ] || exit 2
[ "\$DB_USERNAME" = "mindgarden" ] || exit 2
[ "\$DB_NAME" = "core_solution" ] || exit 2
echo fallback-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-fallback.sh"
check "load-deploy-db-env: 비밀번호 폴백 MG_DEPLOY_DB_PASSWORD_FALLBACK" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_LOCAL_DB_HOST \
  MG_DEPLOY_ENV_FILE="$HELPER_FIXTURE/empty.env" \
  MG_DEPLOY_DB_PASSWORD_FALLBACK=fallback-secret \
  bash "$HELPER_FIXTURE/assert-fallback.sh"
echo "$LAST_OUT" | grep -q "fallback-secret" && { echo "not ok - fallback 비밀번호 노출"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_source pw=fallback_mg_deploy" || { echo "not ok - fallback 소스 로그 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_source host=default" || { echo "not ok - default host 소스 로그 없음"; fail=1; }
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - fallback cred_source 줄에 password 문자열 포함"
  fail=1
fi

# PRODUCTION_DB_PASSWORD 만 있는 시나리오 (헬퍼 단위 — health SSH envs 누락 재발 방지)
cat > "$HELPER_FIXTURE/assert-prod-fallback.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
[ "\$DB_PASSWORD" = "prod-secret-never-echo" ] || exit 2
echo prod-fallback-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-prod-fallback.sh"
check "load-deploy-db-env: PRODUCTION_DB_PASSWORD 폴백 (env 파일 비어 있음)" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK -u MG_LOCAL_DB_HOST \
  MG_DEPLOY_ENV_FILE="$HELPER_FIXTURE/empty.env" \
  PRODUCTION_DB_PASSWORD=prod-secret-never-echo \
  bash "$HELPER_FIXTURE/assert-prod-fallback.sh"
echo "$LAST_OUT" | grep -q "prod-secret-never-echo" && { echo "not ok - PRODUCTION_DB_PASSWORD 값 노출"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_source pw=fallback_production" || { echo "not ok - PRODUCTION_DB_PASSWORD 소스 로그 없음"; fail=1; }
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - PRODUCTION fallback cred_source 줄에 password 문자열 포함"
  fail=1
fi

# PRODUCTION_DB_PASSWORD 도 없으면 비밀번호 empty (health 1045 원인 재현)
cat > "$HELPER_FIXTURE/assert-no-password.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
. "$LOAD_DB"
[ -z "\${DB_PASSWORD:-}" ] || exit 2
echo no-password-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-no-password.sh"
check "load-deploy-db-env: PRODUCTION_DB_PASSWORD 없으면 DB_PASSWORD empty" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK \
  MG_DEPLOY_ENV_FILE="$HELPER_FIXTURE/empty.env" \
  bash "$HELPER_FIXTURE/assert-no-password.sh"
echo "$LAST_OUT" | grep -q "cred_status pw=(empty)" || { echo "not ok - empty 비밀번호 로그 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_source pw=unset" || { echo "not ok - cred_source pw=unset 소스 로그 없음"; fail=1; }
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - empty pw cred_source 줄에 password 문자열 포함"
  fail=1
fi

check "load-deploy-db-env: env 파일 소스 태그(basename)" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK \
  -u MG_DEPLOY_SYSTEMD_UNITS \
  MG_DEPLOY_ENV_FILE="$HELPER_ENV_FILE" \
  bash "$HELPER_FIXTURE/assert-from-file.sh"
_ENV_BASENAME="$(basename "$HELPER_ENV_FILE")"
_ENV_TAG_NORM="${_ENV_BASENAME//./_}"
echo "$LAST_OUT" | grep -q "cred_source pw=${_ENV_TAG_NORM}" || { echo "not ok - env 파일 소스 태그 없음 (want cred_source pw=${_ENV_TAG_NORM})"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_source host=${_ENV_TAG_NORM}" || { echo "not ok - host 소스 태그 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "resolved host=" || { echo "not ok - resolved host 로그 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "file-secret-never-echo" && { echo "not ok - 소스 로그에 비밀번호 값"; fail=1; }
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - basename cred_source 줄에 password 문자열 포함"
  fail=1
fi

# dev.env 파일명 정규화 (dev.env → dev_env)
HELPER_DEV_ENV_NAMED="$HELPER_FIXTURE/dev.env"
cp "$HELPER_ENV_FILE" "$HELPER_DEV_ENV_NAMED"
check "load-deploy-db-env: cred_source pw=dev_env (basename 정규화)" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK \
  -u MG_DEPLOY_SYSTEMD_UNITS \
  MG_DEPLOY_ENV_FILE="$HELPER_DEV_ENV_NAMED" \
  bash "$HELPER_FIXTURE/assert-from-file.sh"
echo "$LAST_OUT" | grep -q "cred_source pw=dev_env" || { echo "not ok - cred_source pw=dev_env 없음"; fail=1; }
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - dev.env cred_source 줄에 password 문자열 포함"
  fail=1
fi

check "load-deploy-db-env: pre-set 소스 태그" 0 \
  env DB_HOST=keep-host DB_USERNAME=keep-user DB_PASSWORD=keep-pass DB_NAME=keep-db DB_PORT=3399 \
  MG_DEPLOY_ENV_FILE="$HELPER_ENV_FILE" \
  bash "$HELPER_FIXTURE/assert-preserve.sh"
echo "$LAST_OUT" | grep -q "cred_source pw=pre_set" || { echo "not ok - pre-set 소스 로그 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "cred_source host=pre_set" || { echo "not ok - host pre-set 소스 로그 없음"; fail=1; }
if echo "$LAST_OUT" | grep -i 'cred_source' | grep -qi 'password'; then
  echo "not ok - pre-set cred_source 줄에 password 문자열 포함"
  fail=1
fi

# --- preflight-deploy-db.sh ---
write_mock_mysql select1_ok
check "preflight: SELECT 1 성공" 0 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD \
  MG_DEPLOY_ENV_FILE="$HELPER_ENV_FILE" \
  FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql" \
  bash "$PREFLIGHT"
echo "$LAST_OUT" | grep -q "SELECT 1 OK" || { echo "not ok - preflight 성공 메시지 없음"; fail=1; }
echo "$LAST_OUT" | grep -q "file-secret-never-echo" && { echo "not ok - preflight 비밀번호 노출"; fail=1; }

write_mock_mysql connect_fail
check "preflight: SELECT 1 실패는 exit 1" 1 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD \
  MG_DEPLOY_ENV_FILE="$HELPER_ENV_FILE" \
  FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql" \
  bash "$PREFLIGHT"
echo "$LAST_OUT" | grep -q "SELECT 1 실패\|트래픽 전환 전 중단" || { echo "not ok - preflight 실패 메시지 없음"; fail=1; }

check "preflight: DB_PASSWORD 없으면 exit 1" 1 \
  env -u DB_HOST -u DB_PORT -u DB_USERNAME -u DB_PASSWORD -u DB_NAME \
  -u PRODUCTION_DB_PASSWORD -u DEV_DB_PASSWORD -u MG_DEPLOY_DB_PASSWORD_FALLBACK \
  MG_DEPLOY_ENV_FILE="$HELPER_FIXTURE/empty.env" \
  FLYWAY_HEALTH_MYSQL_BIN="$MOCK_DIR/mysql" \
  MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql" \
  bash "$PREFLIGHT"
echo "$LAST_OUT" | grep -q "DB_PASSWORD 없음" || { echo "not ok - preflight empty password 메시지 없음"; fail=1; }

# --- mysql-deploy-client: -p 거부 + defaults-extra-file ---
write_mock_mysql select1_ok
cat > "$HELPER_FIXTURE/assert-mysql-client.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=mindgarden DB_PASSWORD=client-secret DB_NAME=core_solution
export MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql"
. "$MYSQL_CLIENT"
mysql_deploy_prepare
# cnf 경로·권한
[ -n "\$MYSQL_DEPLOY_CNF" ] || exit 2
[ -f "\$MYSQL_DEPLOY_CNF" ] || exit 2
perms=\$(stat -c '%a' "\$MYSQL_DEPLOY_CNF" 2>/dev/null || stat -f '%Lp' "\$MYSQL_DEPLOY_CNF")
[ "\$perms" = "600" ] || { echo "perms=\$perms"; exit 2; }
grep -qE '^password="client-secret"\$' "\$MYSQL_DEPLOY_CNF" || exit 2
# 비밀번호가 프로세스 argv 에 -p 로 안 감 — mock 이 거부함
mysql_deploy_query "SELECT 1;" >/dev/null
mysql_deploy_cleanup
[ ! -f "\${MYSQL_DEPLOY_CNF:-/nonexistent}" ] || exit 2
echo mysql-client-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-mysql-client.sh"
check "mysql-deploy-client: defaults-extra-file 0600 + SELECT 1" 0 \
  bash "$HELPER_FIXTURE/assert-mysql-client.sh"

# mock 이 -p 받으면 fail (회귀 가드)
write_mock_mysql select1_ok
out_code=0
"$MOCK_DIR/mysql" -h127.0.0.1 -uroot -psecret -e 'SELECT 1;' >/dev/null 2>&1 || out_code=$?
if [ "$out_code" = "98" ]; then
  echo "ok - mysql mock rejects -p"
else
  echo "not ok - mysql mock -p reject (exit $out_code)"
  fail=1
fi

# --- mysql-deploy-client: option-file quoting (# ; ' " \ space $) ---
# 실패 시 원본 비밀번호를 dump 하지 않음 (길이만).
_mysql_quote_expect() {
  # raw value → expected password="..." line body (quoted)
  local value escaped
  value="$1"
  escaped="${value//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  printf '"%s"' "$escaped"
}

assert_cnf_password_quoted() {
  local label="$1"
  local pass="$2"
  local expected_q line got
  expected_q="$(_mysql_quote_expect "$pass")"
  (
    set -euo pipefail
    export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=u DB_NAME=db
    export DB_PASSWORD="$pass"
    export MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql"
    # shellcheck disable=SC1090
    . "$MYSQL_CLIENT"
    mysql_deploy_prepare
    line="$(grep '^password=' "$MYSQL_DEPLOY_CNF" || true)"
    got="${line#password=}"
    if [ "$got" != "$expected_q" ]; then
      echo "cnf password= form mismatch for case: $label (got_len=${#got} want_len=${#expected_q})" >&2
      mysql_deploy_cleanup
      exit 3
    fi
    grep -qE '^user="u"$' "$MYSQL_DEPLOY_CNF" || { echo "user not quoted ($label)" >&2; exit 3; }
    grep -qE '^host="127.0.0.1"$' "$MYSQL_DEPLOY_CNF" || { echo "host not quoted ($label)" >&2; exit 3; }
    grep -qE '^database="db"$' "$MYSQL_DEPLOY_CNF" || { echo "database not quoted ($label)" >&2; exit 3; }
    grep -qE '^port=3306$' "$MYSQL_DEPLOY_CNF" || { echo "port should stay numeric ($label)" >&2; exit 3; }
    mysql_deploy_cleanup
  )
}

# combined specials: # ; ' " \ space $
SPECIAL_COMBINED=$'p#a;b\'c"d\\e f$g'
if assert_cnf_password_quoted "combined-specials" "$SPECIAL_COMBINED"; then
  echo "ok - mysql-deploy-client: cnf quotes password with #; ' \" \\ space \$"
else
  echo "not ok - mysql-deploy-client: cnf quote format (combined)"
  fail=1
fi

for ch_label in \
  'hash:#' \
  'semi:;' \
  "squote:'" \
  'dquote:"' \
  'backslash:\' \
  'space: ' \
  'dollar:$'
do
  case_name="${ch_label%%:*}"
  ch_val="${ch_label#*:}"
  pass_one="pre${ch_val}post"
  if assert_cnf_password_quoted "$case_name" "$pass_one"; then
    echo "ok - mysql-deploy-client: cnf quote case $case_name"
  else
    echo "not ok - mysql-deploy-client: cnf quote case $case_name"
    fail=1
  fi
done

# umask 022 환경에서도 prepare 후 cnf 는 mode 600
cat > "$HELPER_FIXTURE/assert-umask-mode.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
umask 022
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=u DB_PASSWORD='x' DB_NAME=db
export MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql"
. "$MYSQL_CLIENT"
mysql_deploy_prepare
cnf="\$MYSQL_DEPLOY_CNF"
[ -n "\$cnf" ] && [ -f "\$cnf" ] || exit 2
perms=\$(stat -c '%a' "\$cnf" 2>/dev/null || stat -f '%Lp' "\$cnf")
[ "\$perms" = "600" ] || { echo "perms=\$perms want=600 (ambient umask 022)"; exit 3; }
mysql_deploy_cleanup
[ ! -f "\$cnf" ] || exit 4
echo umask-mode-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-umask-mode.sh"
check "mysql-deploy-client: cnf mode 600 under umask 022" 0 \
  bash "$HELPER_FIXTURE/assert-umask-mode.sh"

# EXIT trap: prepare 후 강제 실패 시 cnf 삭제
cat > "$HELPER_FIXTURE/assert-trap-cleanup.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=u DB_PASSWORD='x' DB_NAME=db
export MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql"
. "$MYSQL_CLIENT"
mysql_deploy_prepare
cnf="\$MYSQL_DEPLOY_CNF"
[ -f "\$cnf" ] || exit 2
# 경로를 부모에 남기고 강제 실패 → EXIT trap 이 정리해야 함
printf '%s' "\$cnf" > "$HELPER_FIXTURE/last-cnf-path"
exit 42
EOF
chmod +x "$HELPER_FIXTURE/assert-trap-cleanup.sh"
set +e
bash "$HELPER_FIXTURE/assert-trap-cleanup.sh" >/dev/null 2>&1
_trap_code=$?
set -e
_trap_cnf="$(cat "$HELPER_FIXTURE/last-cnf-path" 2>/dev/null || true)"
if [ "$_trap_code" = "42" ] && [ -n "$_trap_cnf" ] && [ ! -f "$_trap_cnf" ]; then
  echo "ok - mysql-deploy-client: EXIT trap removes cnf after failure"
else
  echo "not ok - mysql-deploy-client: EXIT trap cleanup (code=$_trap_code cnf_exists=$([ -f "${_trap_cnf:-}" ] && echo yes || echo no))"
  fail=1
fi

# my_print_defaults: unquoted breakage matrix + quoted round-trip
if command -v my_print_defaults >/dev/null 2>&1; then
  # 미인용 breakage matrix — 비밀번호 값 출력 금지 (label + BREAK/OK + lengths)
  unquoted_parse_socket() {
    local raw="$1"
    local cnf out parsed
    cnf="$(mktemp)"
    chmod 600 "$cnf"
    {
      echo '[client]'
      # 의도적으로 미인용 — 특수문자 breakage 증거
      printf 'socket=%s\n' "$raw"
    } >"$cnf"
    out="$(my_print_defaults --defaults-extra-file="$cnf" client 2>/dev/null || true)"
    rm -f "$cnf"
    parsed="$(printf '%s\n' "$out" | sed -n 's/^--socket=//p' | head -1)"
    printf '%s' "$parsed"
  }

  echo "--- unquoted cnf breakage matrix (my_print_defaults) ---"
  for ch_label in \
    'hash:#' \
    'semi:;' \
    "squote:'" \
    'dquote:"' \
    'backslash:\' \
    'space: ' \
    'dollar:$'
  do
    case_name="${ch_label%%:*}"
    ch_val="${ch_label#*:}"
    raw="PRE${ch_val}SUF"
    parsed="$(unquoted_parse_socket "$raw")"
    if [ "$parsed" = "$raw" ]; then
      echo "ok - unquoted matrix $case_name: OK (parsed_len=${#parsed})"
      case "$case_name" in
        hash)
          echo "not ok - unquoted matrix hash: expected BREAK (truncation at #)"
          fail=1
          ;;
      esac
    else
      echo "ok - unquoted matrix $case_name: BREAK (want_len=${#raw} got_len=${#parsed})"
      case "$case_name" in
        hash)
          if [ "$parsed" = "PRE" ]; then
            echo "ok - unquoted matrix hash: truncates at # (got PRE)"
          else
            echo "not ok - unquoted matrix hash: expected truncate to PRE (got_len=${#parsed})"
            fail=1
          fi
          ;;
        *)
          # MySQL 8 option parser: ; " ' \ $ space 는 미인용에서도 생존하는 것이 관측됨
          echo "not ok - unquoted matrix $case_name: expected OK on MySQL 8 (got BREAK)"
          fail=1
          ;;
      esac
    fi
  done

  roundtrip_socket_value() {
    local raw="$1"
    local label="$2"
    local q cnf out parsed
    q="$(_mysql_quote_expect "$raw")"
    cnf="$(mktemp)"
    chmod 600 "$cnf"
    {
      echo '[client]'
      printf 'socket=%s\n' "$q"
    } >"$cnf"
    out="$(my_print_defaults --defaults-extra-file="$cnf" client 2>/dev/null || true)"
    rm -f "$cnf"
    parsed="$(printf '%s\n' "$out" | sed -n 's/^--socket=//p' | head -1)"
    if [ "$parsed" = "$raw" ]; then
      echo "ok - my_print_defaults quoted round-trip ($label)"
    else
      echo "not ok - my_print_defaults quoted round-trip ($label) parsed_len=${#parsed} want_len=${#raw}"
      fail=1
    fi
  }

  roundtrip_socket_value "$SPECIAL_COMBINED" "combined-specials"
  for ch_label in \
    'hash:#' \
    'semi:;' \
    "squote:'" \
    'dquote:"' \
    'backslash:\' \
    'space: ' \
    'dollar:$'
  do
    case_name="${ch_label%%:*}"
    ch_val="${ch_label#*:}"
    roundtrip_socket_value "pre${ch_val}post" "$case_name"
  done
else
  echo "ok - my_print_defaults skip (not installed)"
fi

# --- mysql-deploy-client: error classification (1045 vs option-file parse) ---
write_mock_mysql_err() {
  local mode="$1"
  cat > "$MOCK_DIR/mysql" <<EOF
#!/usr/bin/env bash
set -euo pipefail
for a in "\$@"; do
  case "\$a" in
    -p*|--password=*)
      echo "FAIL: password must not be passed as CLI arg" >&2
      exit 98
      ;;
  esac
done
case "${mode}" in
  err_1045)
    echo "ERROR 1045 (28000): Access denied for user 'u'@'localhost' (using password: YES)" >&2
    echo "password=SHOULD_NOT_LEAK" >&2
    exit 1
    ;;
  err_cnf)
    echo "error: Found option without preceding group in config file: /tmp/x.cnf at line 1." >&2
    echo "password=SHOULD_NOT_LEAK" >&2
    exit 1
    ;;
  *)
    echo "unexpected mock mode" >&2
    exit 2
    ;;
esac
EOF
  chmod +x "$MOCK_DIR/mysql"
}

write_mock_mysql_err err_1045
cat > "$HELPER_FIXTURE/assert-err-1045.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=u DB_PASSWORD='sec#ret' DB_NAME=db
export MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql"
. "$MYSQL_CLIENT"
mysql_deploy_prepare
set +e
out="\$(mysql_deploy_query "SELECT 1;" 2>&1)"
code=\$?
set -e
[ "\$code" -eq 1 ] || exit 2
printf '%s\n' "\$out" | grep -q 'MySQL 1045 access denied' || exit 3
printf '%s\n' "\$out" | grep -q 'option-file/cnf parse error' && exit 4
printf '%s\n' "\$out" | grep -qi 'password=SHOULD_NOT_LEAK' && exit 5
printf '%s\n' "\$out" | grep -q 'sec#ret' && exit 6
echo err-1045-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-err-1045.sh"
check "mysql-deploy-client: classifies ERROR 1045" 0 \
  bash "$HELPER_FIXTURE/assert-err-1045.sh"
echo "$LAST_OUT" | grep -q 'sec#ret' && { echo "not ok - 1045 path leaked password"; fail=1; }

write_mock_mysql_err err_cnf
cat > "$HELPER_FIXTURE/assert-err-cnf.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=u DB_PASSWORD='sec#ret' DB_NAME=db
export MYSQL_DEPLOY_MYSQL_BIN="$MOCK_DIR/mysql"
. "$MYSQL_CLIENT"
mysql_deploy_prepare
set +e
out="\$(mysql_deploy_query "SELECT 1;" 2>&1)"
code=\$?
set -e
[ "\$code" -eq 1 ] || exit 2
printf '%s\n' "\$out" | grep -q 'option-file/cnf parse error' || exit 3
printf '%s\n' "\$out" | grep -q 'MySQL 1045 access denied' && exit 4
printf '%s\n' "\$out" | grep -qi 'password=SHOULD_NOT_LEAK' && exit 5
printf '%s\n' "\$out" | grep -q 'sec#ret' && exit 6
echo err-cnf-ok
EOF
chmod +x "$HELPER_FIXTURE/assert-err-cnf.sh"
check "mysql-deploy-client: classifies option-file parse error" 0 \
  bash "$HELPER_FIXTURE/assert-err-cnf.sh"
echo "$LAST_OUT" | grep -q 'sec#ret' && { echo "not ok - cnf-parse path leaked password"; fail=1; }

# restore select1 mock for any later tests
write_mock_mysql select1_ok

# --- deploy-backend-dev.yml: mysql-deploy-client 통일 (MYSQL_PWD 회귀 가드) ---
# 시크릿·비밀번호 값은 출력하지 않음. 워크플로 텍스트만 검사.
DEV_WF="$(cd "$DIR/../.." && pwd)/.github/workflows/deploy-backend-dev.yml"
if [ ! -f "$DEV_WF" ]; then
  echo "not ok - deploy-backend-dev.yml 없음"
  fail=1
else
  if grep -q 'MYSQL_PWD=' "$DEV_WF"; then
    echo "not ok - deploy-backend-dev.yml still has MYSQL_PWD="
    fail=1
  else
    echo "ok - deploy-backend-dev.yml has no MYSQL_PWD="
  fi
  if grep -qE 'mysql[[:space:]]+-p([^a-zA-Z]|$)' "$DEV_WF"; then
    echo "not ok - deploy-backend-dev.yml still has mysql -p"
    fail=1
  else
    echo "ok - deploy-backend-dev.yml has no mysql -p"
  fi
  for needle in mysql-deploy-client.sh mysql_deploy_prepare mysql_deploy_query; do
    if grep -q "$needle" "$DEV_WF"; then
      echo "ok - deploy-backend-dev.yml contains $needle"
    else
      echo "not ok - deploy-backend-dev.yml missing $needle"
      fail=1
    fi
  done
  # Flyway SCP(source 에 mysql-deploy-client.sh) 가 V20260831_004 repair 문자열보다 앞에 와야 함
  scp_line="$(grep -n 'source:.*"scripts/deployment/.*mysql-deploy-client\.sh' "$DEV_WF" | head -1 | cut -d: -f1 || true)"
  repair_line="$(grep -n '\[V20260831_004\] flyway_schema_history success=0 원샷 repair' "$DEV_WF" | head -1 | cut -d: -f1 || true)"
  if [ -n "${scp_line:-}" ] && [ -n "${repair_line:-}" ] && [ "$scp_line" -lt "$repair_line" ]; then
    echo "ok - Flyway SCP (mysql-deploy-client) before V20260831_004 repair"
  else
    echo "not ok - Flyway SCP must precede V20260831_004 repair (scp=${scp_line:-?} repair=${repair_line:-?})"
    fail=1
  fi
fi

# --- on.push.paths 회귀 가드: 배포 헬퍼·SCP 소스가 paths 에 포함되어야 자동 배포 트리거됨 ---
# paths: 블록을 workflow_dispatch: 직전까지 추출한 뒤 필수 glob 존재 여부만 검사한다.
REPO_ROOT="$(cd "$DIR/../.." && pwd)"
PROD_WF="$REPO_ROOT/.github/workflows/deploy-production.yml"

# 워크플로 YAML 의 on.push.paths 리스트 항목(따옴표 안 경로)만 한 줄씩 출력
extract_push_paths() {
  local wf="$1"
  awk '
    /^[[:space:]]*paths:[[:space:]]*$/ { in_paths=1; next }
    in_paths && /^[[:space:]]*workflow_dispatch:[[:space:]]*$/ { exit }
    in_paths && /^[^[:space:]#]/ { exit }
    in_paths && /^[[:space:]]*-[[:space:]]*'\''([^'\'']+)'\''/ {
      line=$0
      sub(/^[[:space:]]*-[[:space:]]*'\''/, "", line)
      sub(/'\''[[:space:]]*$/, "", line)
      print line
    }
  ' "$wf"
}

assert_path_glob() {
  local label="$1" paths_blob="$2" glob="$3"
  if printf '%s\n' "$paths_blob" | grep -qxF "$glob"; then
    echo "ok - $label paths has $glob"
  else
    echo "not ok - $label paths missing $glob"
    fail=1
  fi
}

# systemd: directory glob 또는 단일 unit 파일 중 하나면 통과
assert_systemd_path() {
  local label="$1" paths_blob="$2"
  if printf '%s\n' "$paths_blob" | grep -qxF 'config/systemd/**' \
    || printf '%s\n' "$paths_blob" | grep -qxF 'config/systemd/mindgarden-dev.service'; then
    echo "ok - $label paths has config/systemd/** (or mindgarden-dev.service)"
  else
    echo "not ok - $label paths missing config/systemd/** (or mindgarden-dev.service)"
    fail=1
  fi
}

if [ ! -f "$DEV_WF" ]; then
  echo "not ok - deploy-backend-dev.yml 없음 (paths 가드)"
  fail=1
else
  DEV_PATHS="$(extract_push_paths "$DEV_WF")"
  assert_path_glob "deploy-backend-dev" "$DEV_PATHS" "scripts/deployment/**"
  assert_path_glob "deploy-backend-dev" "$DEV_PATHS" "scripts/automation/deployment/**"
  assert_path_glob "deploy-backend-dev" "$DEV_PATHS" ".github/workflows/deploy-backend-dev.yml"
  assert_path_glob "deploy-backend-dev" "$DEV_PATHS" "scripts/development/utilities/**"
  assert_systemd_path "deploy-backend-dev" "$DEV_PATHS"
  assert_path_glob "deploy-backend-dev" "$DEV_PATHS" "database/schema/**"
fi

if [ ! -f "$PROD_WF" ]; then
  echo "not ok - deploy-production.yml 없음 (paths 가드)"
  fail=1
else
  PROD_PATHS="$(extract_push_paths "$PROD_WF")"
  assert_path_glob "deploy-production" "$PROD_PATHS" "scripts/deployment/**"
  assert_path_glob "deploy-production" "$PROD_PATHS" "scripts/automation/deployment/**"
  assert_path_glob "deploy-production" "$PROD_PATHS" ".github/workflows/deploy-production.yml"
  assert_path_glob "deploy-production" "$PROD_PATHS" "config/nginx/**"
  assert_path_glob "deploy-production" "$PROD_PATHS" "database/schema/**"
  assert_path_glob "deploy-production" "$PROD_PATHS" "src/main/resources/sql/**"
  assert_path_glob "deploy-production" "$PROD_PATHS" ".github/actions/sync-prod-env-key/**"

  # DB preflight 구간: PREFLIGHT_DB= … bash "$PREFLIGHT_DB" 사이에 REQUIRED=1 필수
  PREFLIGHT_REGION="$(awk '
    /PREFLIGHT_DB=/ { capturing=1 }
    capturing { print }
    capturing && /bash "\$PREFLIGHT_DB"/ { exit }
  ' "$PROD_WF")"
  if printf '%s\n' "$PREFLIGHT_REGION" | grep -q 'MG_DEPLOY_ENV_FILE_REQUIRED=1'; then
    echo "ok - deploy-production.yml preflight region has MG_DEPLOY_ENV_FILE_REQUIRED=1"
  else
    echo "not ok - deploy-production.yml preflight region missing MG_DEPLOY_ENV_FILE_REQUIRED=1"
    fail=1
  fi
fi

# --- deploy-backend-dev.yml: systemd SCP 전용 tmp 디렉터리 + 레포 unit 적용 + 업로드 전 stop 제거 + failure 롤백 ---
if [ ! -f "$DEV_WF" ]; then
  echo "not ok - deploy-backend-dev.yml 없음 (systemd SCP 가드)"
  fail=1
else
  # systemd 업로드 step 근처: target /tmp/mindgarden-dev-systemd/ + strip_components: 2
  SYSTEMD_SCP_BLOCK="$(awk '
    /name:.*systemd 서비스 파일 업로드/ { capturing=1 }
    capturing { print }
    capturing && /overwrite:/ { exit }
  ' "$DEV_WF")"
  if printf '%s\n' "$SYSTEMD_SCP_BLOCK" | grep -qE 'target:[[:space:]]*"/tmp/mindgarden-dev-systemd/"?'; then
    echo "ok - deploy-backend-dev.yml systemd SCP target is /tmp/mindgarden-dev-systemd/"
  else
    echo "not ok - deploy-backend-dev.yml systemd SCP target must be \"/tmp/mindgarden-dev-systemd/\""
    fail=1
  fi
  if printf '%s\n' "$SYSTEMD_SCP_BLOCK" | grep -q 'strip_components:[[:space:]]*2'; then
    echo "ok - deploy-backend-dev.yml systemd SCP has strip_components: 2"
  else
    echo "not ok - deploy-backend-dev.yml systemd SCP missing strip_components: 2"
    fail=1
  fi
  if grep -q '레포 unit 적용' "$DEV_WF"; then
    echo "ok - deploy-backend-dev.yml contains 레포 unit 적용"
  else
    echo "not ok - deploy-backend-dev.yml missing 레포 unit 적용"
    fail=1
  fi
  if grep -q '/tmp/mindgarden-dev-systemd/mindgarden-dev.service' "$DEV_WF"; then
    echo "ok - deploy-backend-dev.yml install path is /tmp/mindgarden-dev-systemd/mindgarden-dev.service"
  else
    echo "not ok - deploy-backend-dev.yml missing /tmp/mindgarden-dev-systemd/mindgarden-dev.service install path"
    fail=1
  fi

  # 업로드 전 disk/backup step(백업 완료) 에는 systemctl stop 이 없어야 함
  BACKUP_PREP_BLOCK="$(awk '
    /name:.*개발 서버 배포 준비/ { capturing=1 }
    capturing { print }
    capturing && /백업 완료/ { found=1 }
    capturing && found && /^[[:space:]]*-[[:space:]]*name:/ { exit }
  ' "$DEV_WF")"
  if printf '%s\n' "$BACKUP_PREP_BLOCK" | grep -q '백업 완료'; then
    if printf '%s\n' "$BACKUP_PREP_BLOCK" | grep -q 'systemctl stop'; then
      echo "not ok - deploy-backend-dev.yml backup/disk prep must not systemctl stop before uploads"
      fail=1
    else
      echo "ok - deploy-backend-dev.yml backup/disk prep has no systemctl stop"
    fi
  else
    echo "not ok - deploy-backend-dev.yml backup/disk prep block (백업 완료) not found"
    fail=1
  fi

  # failure() 롤백: 백업 JAR 복구 + actuator/health 가 같은 if: failure() 블록에 존재
  # (step 은 "- name:" 로 시작, 다음 "- name:" 또는 job 키 전까지를 한 블록으로 본다)
  FAILURE_WITH_HEALTH="$(python3 - "$DEV_WF" <<'PY'
import re, sys
lines = open(sys.argv[1], encoding='utf-8').read().splitlines()
i = 0
while i < len(lines):
    if 'if: failure()' in lines[i]:
        block = [lines[i]]
        j = i + 1
        while j < len(lines):
            if re.match(r'^    - name:', lines[j]) or re.match(r'^  [A-Za-z0-9_-]+:', lines[j]):
                break
            block.append(lines[j])
            j += 1
        text = '\n'.join(block)
        if 'app.jar.backup' in text and ('actuator/health' in text or 'rollback health' in text):
            print('FOUND')
            raise SystemExit(0)
        i = j
    else:
        i += 1
print('MISSING')
PY
)"
  if [ "$FAILURE_WITH_HEALTH" = "FOUND" ]; then
    echo "ok - deploy-backend-dev.yml has failure() block with app.jar.backup AND actuator/health"
  else
    echo "not ok - deploy-backend-dev.yml missing failure() block with both app.jar.backup and actuator/health"
    fail=1
  fi

  # 모든 appleboy/scp-action 이 첫 systemctl stop mindgarden-dev 보다 앞에 있어야 함
  STOP_LINE="$(grep -n 'systemctl stop mindgarden-dev' "$DEV_WF" | head -1 | cut -d: -f1 || true)"
  SCP_AFTER_STOP=0
  while IFS= read -r scp_ln; do
    if [ -n "$STOP_LINE" ] && [ "$scp_ln" -ge "$STOP_LINE" ]; then
      echo "not ok - scp-action at line $scp_ln is after systemctl stop (line $STOP_LINE)"
      SCP_AFTER_STOP=1
      fail=1
    fi
  done < <(grep -n 'appleboy/scp-action' "$DEV_WF" | cut -d: -f1)
  if [ "$SCP_AFTER_STOP" = "0" ] && [ -n "$STOP_LINE" ]; then
    SCP_COUNT="$(grep -c 'appleboy/scp-action' "$DEV_WF" || true)"
    echo "ok - all $SCP_COUNT scp-action step(s) appear before systemctl stop mindgarden-dev (line $STOP_LINE)"
  elif [ -z "$STOP_LINE" ]; then
    echo "not ok - systemctl stop mindgarden-dev not found in deploy-backend-dev.yml"
    fail=1
  fi

  # Flyway SCP 가 HQ env 주입보다 앞에 있어야 함 (업로드 묶음)
  FLYWAY_SCP_LINE="$(grep -n 'name:.*Flyway 스키마 헬스 스크립트 업로드' "$DEV_WF" | head -1 | cut -d: -f1 || true)"
  HQ_ENV_LINE="$(grep -n 'name:.*MINDGARDEN_HQ_TENANT_ID env' "$DEV_WF" | head -1 | cut -d: -f1 || true)"
  if [ -n "${FLYWAY_SCP_LINE:-}" ] && [ -n "${HQ_ENV_LINE:-}" ] && [ "$FLYWAY_SCP_LINE" -lt "$HQ_ENV_LINE" ]; then
    echo "ok - Flyway SCP before HQ env injection (scp=$FLYWAY_SCP_LINE hq=$HQ_ENV_LINE)"
  else
    echo "not ok - Flyway SCP must precede HQ env injection (scp=${FLYWAY_SCP_LINE:-?} hq=${HQ_ENV_LINE:-?})"
    fail=1
  fi
fi

# --- deploy-production.yml: failure() 트래픽 슬롯 기동 가드 (upstream 전환 없음) ---
if [ ! -f "$PROD_WF" ]; then
  echo "not ok - deploy-production.yml 없음 (traffic slot failure 가드)"
  fail=1
else
  PROD_TRAFFIC_GUARD="$(python3 - "$PROD_WF" <<'PY'
import re, sys
lines = open(sys.argv[1], encoding='utf-8').read().splitlines()
i = 0
while i < len(lines):
    if 'if: failure()' in lines[i]:
        block = [lines[i]]
        j = i + 1
        while j < len(lines):
            if re.match(r'^    - name:', lines[j]) or re.match(r'^  [A-Za-z0-9_-]+:', lines[j]):
                break
            block.append(lines[j])
            j += 1
        text = '\n'.join(block)
        if 'active-backend' in text and 'mindgarden-core-' in text and 'systemctl start' in text:
            print('FOUND')
            raise SystemExit(0)
        i = j
    else:
        i += 1
print('MISSING')
PY
)"
  if [ "$PROD_TRAFFIC_GUARD" = "FOUND" ]; then
    echo "ok - deploy-production.yml has failure() traffic slot start guard (active-backend + mindgarden-core-)"
  else
    echo "not ok - deploy-production.yml missing failure() with active-backend / mindgarden-core- start recovery"
    fail=1
  fi
  # 가드 step 이 notify-discord 보다 앞에(배포 job 말미)
  GUARD_LINE="$(grep -n 'failure 시 트래픽 슬롯 unit 기동 가드' "$PROD_WF" | head -1 | cut -d: -f1 || true)"
  NOTIFY_LINE="$(grep -n 'notify-discord-on-failure:' "$PROD_WF" | head -1 | cut -d: -f1 || true)"
  if [ -n "${GUARD_LINE:-}" ] && [ -n "${NOTIFY_LINE:-}" ] && [ "$GUARD_LINE" -lt "$NOTIFY_LINE" ]; then
    echo "ok - deploy-production.yml traffic slot guard before notify-discord (guard=$GUARD_LINE notify=$NOTIFY_LINE)"
  else
    echo "not ok - deploy-production.yml traffic slot guard must precede notify-discord (guard=${GUARD_LINE:-?} notify=${NOTIFY_LINE:-?})"
    fail=1
  fi
fi

exit "$fail"
