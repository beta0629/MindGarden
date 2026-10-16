#!/usr/bin/env bash
# Flyway 스키마 헬스 점검 (읽기 전용 SELECT 만).
#
# 환경 변수(필수 — 워크플로가 load-deploy-db-env.sh 로 DB_* 를 export 한 뒤 호출 권장):
#   DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME
# 선택:
#   DB_PORT                         기본 3306
#   FLYWAY_HEALTH_RECENT_LIMIT      최신 적용 건수 (기본 5)
#   FLYWAY_HEALTH_REQUIRED_VERSIONS 쉼표 구분 version (기본 20261016.001,20261016.002)
#   FLYWAY_HEALTH_REQUIRED_COLUMN   information_schema 컬럼 검사
#                                   (기본 payments.verify_unknown_exhausted_last_polled_at)
#   FLYWAY_HEALTH_MYSQL_BIN         mysql 클라이언트 경로 (테스트용 mock)
#
# DB_* 로드는 호출 전 load-deploy-db-env.sh 를 source 한다 (본 스크립트는 덮어쓰지 않음).
# 인증: mysql-deploy-client.sh (--defaults-extra-file). -p / MYSQL_PWD+sudo -E 금지.
#
# 종료 코드:
#   0  — 검사 통과
#   1  — connection failure / flyway_schema_history 없음 / 필수 version·column 누락 /
#        success=0 / DB env 누락 / mysql 없음 / malformed version / bare column /
#        (워크플로) env·스크립트 누락
#
# 비밀번호는 절대 echo 하지 않는다.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MYSQL_CLIENT_SH="${SCRIPT_DIR}/mysql-deploy-client.sh"

DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-3306}"
DB_USERNAME="${DB_USERNAME:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-}"
RECENT_LIMIT="${FLYWAY_HEALTH_RECENT_LIMIT:-5}"
REQUIRED_VERSIONS="${FLYWAY_HEALTH_REQUIRED_VERSIONS:-20261016.001,20261016.002}"
REQUIRED_COLUMN="${FLYWAY_HEALTH_REQUIRED_COLUMN:-payments.verify_unknown_exhausted_last_polled_at}"
MYSQL_BIN="${FLYWAY_HEALTH_MYSQL_BIN:-mysql}"

mask_secret_text() {
  local text="$1"
  text=$(printf '%s' "$text" | sed -E 's/(-p|--password=)[^ ]*/\1***/g; s/password[=:][^ ]*/password=***/Ig')
  if [ -n "${DB_PASSWORD:-}" ]; then
    text=$(printf '%s' "$text" | DB_PASSWORD="$DB_PASSWORD" awk '{ gsub(ENVIRON["DB_PASSWORD"], "***"); print }')
  fi
  printf '%s' "$text"
}

if [ -f "$MYSQL_CLIENT_SH" ]; then
  # shellcheck disable=SC1090
  . "$MYSQL_CLIENT_SH"
  MYSQL_DEPLOY_MYSQL_BIN="$MYSQL_BIN"
  export MYSQL_DEPLOY_MYSQL_BIN
else
  echo "❌ mysql-deploy-client.sh 없음 ($MYSQL_CLIENT_SH) — Flyway 헬스 실패(치명)"
  exit 1
fi

mysql_query() {
  local sql="$1"
  local stdout_file stderr_file code
  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  if [ -z "${MYSQL_DEPLOY_CNF:-}" ] || [ ! -f "${MYSQL_DEPLOY_CNF:-}" ]; then
    mysql_deploy_prepare
  fi
  set +e
  "$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEPLOY_CNF" -N -e "$sql" \
    >"$stdout_file" 2>"$stderr_file"
  code=$?
  set -e
  MYSQL_LAST_STDOUT="$(cat "$stdout_file")"
  MYSQL_LAST_STDERR="$(mask_secret_text "$(cat "$stderr_file")")"
  MYSQL_LAST_CODE="$code"
  rm -f "$stdout_file" "$stderr_file"
  return "$code"
}

echo "🔍 Flyway 스키마 헬스 점검 (읽기 전용)"
echo "   host=${DB_HOST:-"(empty)"} port=${DB_PORT} user=${DB_USERNAME:-"(empty)"} db=${DB_NAME:-"(empty)"}"
if [ -n "${DB_PASSWORD:-}" ]; then
  echo "   DB_PASSWORD=set mysql=${MYSQL_BIN} (auth=defaults-extra-file, no -p CLI)"
else
  echo "   DB_PASSWORD=(empty) mysql=${MYSQL_BIN}"
fi

if [ -z "$DB_HOST" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_NAME" ] || [ -z "$DB_PASSWORD" ]; then
  echo "❌ DB_HOST/DB_USERNAME/DB_PASSWORD/DB_NAME 중 누락 — Flyway 헬스 실패(치명)"
  exit 1
fi
if ! command -v "$MYSQL_BIN" >/dev/null 2>&1 && [ ! -x "$MYSQL_BIN" ]; then
  echo "❌ mysql 클라이언트 없음 ($MYSQL_BIN) — Flyway 헬스 실패(치명)"
  exit 1
fi

# --- 연결 확인 ---
if ! mysql_query "SELECT 1;"; then
  echo "❌ DB 연결 실패 (치명) — mysql exit=${MYSQL_LAST_CODE}"
  if [ -n "$MYSQL_LAST_STDERR" ]; then
    echo "   mysql stderr: $MYSQL_LAST_STDERR"
  fi
  case "$MYSQL_LAST_STDERR" in
    *ERROR\ 2003*|*Can?t\ connect*|*Connection\ refused*)
      echo "   오류 클래스: connection_refused_or_unreachable"
      ;;
    *ERROR\ 1045*|*Access\ denied*)
      echo "   오류 클래스: access_denied"
      ;;
    *ERROR\ 1049*|*Unknown\ database*)
      echo "   오류 클래스: unknown_database"
      ;;
    *)
      echo "   오류 클래스: other_or_unknown"
      ;;
  esac
  mysql_deploy_cleanup
  exit 1
fi
echo "✅ DB 연결 성공"

# --- flyway_schema_history 존재 ---
if ! mysql_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'flyway_schema_history';"; then
  echo "❌ flyway_schema_history 존재 여부 조회 실패 (치명) exit=${MYSQL_LAST_CODE}"
  [ -n "$MYSQL_LAST_STDERR" ] && echo "   mysql stderr: $MYSQL_LAST_STDERR"
  mysql_deploy_cleanup
  exit 1
fi
TABLE_COUNT="$(echo "$MYSQL_LAST_STDOUT" | tr -d '[:space:]')"
if [ "${TABLE_COUNT:-0}" = "0" ]; then
  echo "❌ flyway_schema_history 테이블 없음 — Flyway 헬스 실패(치명)"
  mysql_deploy_cleanup
  exit 1
fi
echo "✅ flyway_schema_history 테이블 존재"

# --- success=0 치명 ---
if ! mysql_query "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0;"; then
  echo "❌ success=0 건수 조회 실패 (치명) exit=${MYSQL_LAST_CODE}"
  [ -n "$MYSQL_LAST_STDERR" ] && echo "   mysql stderr: $MYSQL_LAST_STDERR"
  mysql_deploy_cleanup
  exit 1
fi
FAIL_COUNT="$(echo "$MYSQL_LAST_STDOUT" | tr -d '[:space:]')"
if [ "${FAIL_COUNT:-0}" != "0" ]; then
  echo "❌ flyway_schema_history 에 success=0 마이그레이션 ${FAIL_COUNT}건 — 배포 중단(치명)"
  mysql_query "SELECT installed_rank, version, description, success, installed_on FROM flyway_schema_history WHERE success = 0 ORDER BY installed_rank DESC LIMIT 20;" || true
  [ -n "$MYSQL_LAST_STDOUT" ] && echo "$MYSQL_LAST_STDOUT"
  [ -n "$MYSQL_LAST_STDERR" ] && echo "   mysql stderr: $MYSQL_LAST_STDERR"
  mysql_deploy_cleanup
  exit 1
fi
echo "✅ success=0 마이그레이션 없음"

# --- 최신 N건 ---
echo "📋 flyway_schema_history 최신 ${RECENT_LIMIT}건 (version, success):"
if mysql_query "SELECT version, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT ${RECENT_LIMIT};"; then
  echo "$MYSQL_LAST_STDOUT"
else
  echo "⚠️ 최신 건 조회 실패 exit=${MYSQL_LAST_CODE}"
  [ -n "$MYSQL_LAST_STDERR" ] && echo "   mysql stderr: $MYSQL_LAST_STDERR"
fi

# --- 필수 version (version 컬럼 또는 script LIKE 폴백; 점→_ 형태도 매치) ---
IFS=',' read -r -a REQ_VER_ARR <<< "$REQUIRED_VERSIONS"
for ver in "${REQ_VER_ARR[@]}"; do
  ver="$(echo "$ver" | tr -d '[:space:]')"
  [ -z "$ver" ] && continue
  if ! [[ "$ver" =~ ^[0-9A-Za-z._-]+$ ]]; then
    echo "❌ 필수 version 형식 거부(malformed): ${ver} — 허용: [0-9A-Za-z._-]+ (치명)"
    mysql_deploy_cleanup
    exit 1
  fi
  ver_us="${ver//./_}"
  ver_sql="version = '${ver}' OR script LIKE '%${ver}%'"
  if [ "$ver_us" != "$ver" ]; then
    ver_sql="${ver_sql} OR version = '${ver_us}' OR script LIKE '%${ver_us}%'"
  fi
  if ! mysql_query "SELECT COUNT(*) FROM flyway_schema_history WHERE ${ver_sql};"; then
    echo "❌ 필수 version 조회 실패: ${ver} (치명) exit=${MYSQL_LAST_CODE}"
    [ -n "$MYSQL_LAST_STDERR" ] && echo "   mysql stderr: $MYSQL_LAST_STDERR"
    mysql_deploy_cleanup
    exit 1
  fi
  cnt="$(echo "$MYSQL_LAST_STDOUT" | tr -d '[:space:]')"
  if [ "${cnt:-0}" = "0" ]; then
    echo "❌ 필수 Flyway version 미확인: ${ver} (치명)"
    mysql_deploy_cleanup
    exit 1
  fi
  echo "✅ 필수 Flyway version 확인: ${ver}"
done

# --- 필수 컬럼 (table.column — prefix 필수) ---
REQ_TABLE="${REQUIRED_COLUMN%%.*}"
REQ_COL="${REQUIRED_COLUMN#*.}"
if [ -z "$REQUIRED_COLUMN" ]; then
  echo "❌ 필수 컬럼 스펙 비어 있음 (치명)"
  mysql_deploy_cleanup
  exit 1
fi
if [ -z "$REQ_TABLE" ] || [ -z "$REQ_COL" ] || [ "$REQ_TABLE" = "$REQUIRED_COLUMN" ]; then
  echo "❌ 필수 컬럼 형식 거부(bare column, table. 접두사 필요): ${REQUIRED_COLUMN} (치명)"
  mysql_deploy_cleanup
  exit 1
fi
if ! mysql_query "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '${REQ_TABLE}' AND column_name = '${REQ_COL}';"; then
  echo "❌ 컬럼 존재 조회 실패: ${REQUIRED_COLUMN} (치명) exit=${MYSQL_LAST_CODE}"
  [ -n "$MYSQL_LAST_STDERR" ] && echo "   mysql stderr: $MYSQL_LAST_STDERR"
  mysql_deploy_cleanup
  exit 1
fi
col_cnt="$(echo "$MYSQL_LAST_STDOUT" | tr -d '[:space:]')"
if [ "${col_cnt:-0}" = "0" ]; then
  echo "❌ 필수 컬럼 없음: ${REQUIRED_COLUMN} (치명)"
  mysql_deploy_cleanup
  exit 1
fi
echo "✅ 필수 컬럼 존재: ${REQUIRED_COLUMN}"

mysql_deploy_cleanup
echo "✅ Flyway 스키마 헬스 점검 완료"
exit 0
