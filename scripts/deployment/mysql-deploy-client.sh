#!/usr/bin/env bash
# 배포 SSH 세션용 mysql 클라이언트 헬퍼 (source 전용).
#
# 인증: --defaults-extra-file (0600 mktemp) 만 사용.
#   - CLI -p / --password= 금지
#   - MYSQL_PWD + sudo -E 의존 금지 (sudoers env_reset 시 MYSQL_PWD 유실 → 1045)
#   - root 호출도 동일 cnf 로 `sudo mysql --defaults-extra-file=...` (sudo -E 불필요)
#
# 선행(또는 mysql_deploy_prepare 인자): DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME
# export: MYSQL_DEPLOY_CNF (임시 파일 경로)
#
# 함수:
#   mysql_deploy_prepare [user] [password] [host] [port] [database]
#   mysql_deploy_query SQL [extra mysql args...]
#   mysql_deploy_query_sudo SQL [root_password]
#   mysql_deploy_cleanup
#
# shellcheck disable=SC2034
set -euo pipefail

MYSQL_DEPLOY_CNF="${MYSQL_DEPLOY_CNF:-}"
MYSQL_DEPLOY_MYSQL_BIN="${MYSQL_DEPLOY_MYSQL_BIN:-mysql}"
_MYSQL_DEPLOY_TRAP_SET="${_MYSQL_DEPLOY_TRAP_SET:-0}"

mysql_deploy_cleanup() {
  if [ -n "${MYSQL_DEPLOY_CNF:-}" ] && [ -f "$MYSQL_DEPLOY_CNF" ]; then
    rm -f "$MYSQL_DEPLOY_CNF"
  fi
  MYSQL_DEPLOY_CNF=""
}

mysql_deploy_prepare() {
  local user="${1:-${DB_USERNAME:-}}"
  local password="${2:-${DB_PASSWORD:-}}"
  local host="${3:-${DB_HOST:-${MG_LOCAL_DB_HOST:-127.0.0.1}}}"
  local port="${4:-${DB_PORT:-3306}}"
  local database="${5:-${DB_NAME:-}}"

  mysql_deploy_cleanup
  MYSQL_DEPLOY_CNF="$(mktemp)"
  chmod 600 "$MYSQL_DEPLOY_CNF"
  {
    echo '[client]'
    printf 'host=%s\n' "$host"
    printf 'port=%s\n' "$port"
    printf 'user=%s\n' "$user"
    # 비밀번호 특수문자 보존 — 값 echo/로그 금지
    printf 'password=%s\n' "$password"
    if [ -n "$database" ]; then
      printf 'database=%s\n' "$database"
    fi
  } >"$MYSQL_DEPLOY_CNF"

  if [ "$_MYSQL_DEPLOY_TRAP_SET" != "1" ]; then
    trap 'mysql_deploy_cleanup' EXIT
    _MYSQL_DEPLOY_TRAP_SET=1
  fi
  export MYSQL_DEPLOY_CNF
}

mysql_deploy_query() {
  local sql="$1"
  shift || true
  if [ -z "${MYSQL_DEPLOY_CNF:-}" ] || [ ! -f "${MYSQL_DEPLOY_CNF:-}" ]; then
    mysql_deploy_prepare
  fi
  "$MYSQL_DEPLOY_MYSQL_BIN" --defaults-extra-file="$MYSQL_DEPLOY_CNF" -N -e "$sql" "$@"
}

# root 는 별도 cnf(user=root). sudo 가 파일을 읽으므로 0600 소유자≠root 여도 OK.
# sudo -E / MYSQL_PWD 불필요.
mysql_deploy_query_sudo() {
  local sql="$1"
  local root_pass="${2:-${DB_PASSWORD:-}}"
  local host="${DB_HOST:-${MG_LOCAL_DB_HOST:-127.0.0.1}}"
  local port="${DB_PORT:-3306}"
  local database="${DB_NAME:-}"
  local cnf code

  cnf="$(mktemp)"
  chmod 600 "$cnf"
  {
    echo '[client]'
    printf 'host=%s\n' "$host"
    printf 'port=%s\n' "$port"
    echo 'user=root'
    printf 'password=%s\n' "$root_pass"
    if [ -n "$database" ]; then
      printf 'database=%s\n' "$database"
    fi
  } >"$cnf"

  set +e
  sudo mysql --defaults-extra-file="$cnf" -N -e "$sql"
  code=$?
  set -e
  rm -f "$cnf"
  return "$code"
}
