#!/usr/bin/env bash
# 배포 SSH 세션용 mysql 클라이언트 헬퍼 (source 전용).
#
# 인증: --defaults-extra-file (0600 mktemp) 만 사용.
#   - CLI -p / --password= 금지
#   - MYSQL_PWD + sudo -E 의존 금지 (sudoers env_reset 시 MYSQL_PWD 유실 → 1045)
#   - root 호출도 동일 cnf 로 `sudo mysql --defaults-extra-file=...` (sudo -E 불필요)
#   - option-file 값: # ; 공백 등 보존을 위해 큰따옴표 + \ " escape (password= 미인용 시 # 주석 절단 → 1045)
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

# MySQL option-file 값 quoting: \ → \\, " → \", 결과를 "..." 로 감쌈.
# 시크릿을 echo/로그하지 말 것 — 호출측이 반환값을 파일에만 쓴다.
_mysql_deploy_quote_option_value() {
  local value="$1"
  local escaped
  escaped="${value//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  printf '"%s"' "$escaped"
}

# stderr 분류·재출력. password= 라인 제거. 시크릿 값 출력 금지.
_mysql_deploy_classify_error() {
  local errfile="$1"
  local err
  if [ ! -f "$errfile" ]; then
    return 0
  fi
  err="$(grep -v -i '^[[:space:]]*password=' "$errfile" 2>/dev/null || true)"
  if printf '%s\n' "$err" | grep -qiE \
    'defaults-extra-file|option.?file|config file|Found option without preceding group|unknown option|error while parsing'; then
    echo '::error::mysql-deploy-client: option-file/cnf parse error (defaults-extra-file)' >&2
  elif printf '%s\n' "$err" | grep -qiE 'ERROR[[:space:]]*1045|Access denied for user'; then
    echo '::error::mysql-deploy-client: MySQL 1045 access denied (auth failed; check password source / cnf quoting)' >&2
  fi
  if [ -n "$err" ]; then
    printf '%s\n' "$err" >&2
  fi
}

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
    printf 'host=%s\n' "$(_mysql_deploy_quote_option_value "$host")"
    printf 'port=%s\n' "$port"
    printf 'user=%s\n' "$(_mysql_deploy_quote_option_value "$user")"
    # 비밀번호 특수문자 보존 — 값 echo/로그 금지
    printf 'password=%s\n' "$(_mysql_deploy_quote_option_value "$password")"
    if [ -n "$database" ]; then
      printf 'database=%s\n' "$(_mysql_deploy_quote_option_value "$database")"
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
  local errfile code
  errfile="$(mktemp)"
  set +e
  "$MYSQL_DEPLOY_MYSQL_BIN" --defaults-extra-file="$MYSQL_DEPLOY_CNF" -N -e "$sql" "$@" 2>"$errfile"
  code=$?
  set -e
  if [ "$code" -ne 0 ]; then
    _mysql_deploy_classify_error "$errfile"
  elif [ -s "$errfile" ]; then
    # 성공이어도 stderr 가 있으면 password= 만 제거 후 전달
    grep -v -i '^[[:space:]]*password=' "$errfile" >&2 || true
  fi
  rm -f "$errfile"
  return "$code"
}

# root 는 별도 cnf(user=root). sudo 가 파일을 읽으므로 0600 소유자≠root 여도 OK.
# sudo -E / MYSQL_PWD 불필요.
mysql_deploy_query_sudo() {
  local sql="$1"
  local root_pass="${2:-${DB_PASSWORD:-}}"
  local host="${DB_HOST:-${MG_LOCAL_DB_HOST:-127.0.0.1}}"
  local port="${DB_PORT:-3306}"
  local database="${DB_NAME:-}"
  local cnf errfile code

  cnf="$(mktemp)"
  errfile="$(mktemp)"
  chmod 600 "$cnf"
  {
    echo '[client]'
    printf 'host=%s\n' "$(_mysql_deploy_quote_option_value "$host")"
    printf 'port=%s\n' "$port"
    printf 'user=%s\n' "$(_mysql_deploy_quote_option_value "root")"
    printf 'password=%s\n' "$(_mysql_deploy_quote_option_value "$root_pass")"
    if [ -n "$database" ]; then
      printf 'database=%s\n' "$(_mysql_deploy_quote_option_value "$database")"
    fi
  } >"$cnf"

  set +e
  sudo mysql --defaults-extra-file="$cnf" -N -e "$sql" 2>"$errfile"
  code=$?
  set -e
  if [ "$code" -ne 0 ]; then
    _mysql_deploy_classify_error "$errfile"
  elif [ -s "$errfile" ]; then
    grep -v -i '^[[:space:]]*password=' "$errfile" >&2 || true
  fi
  rm -f "$cnf" "$errfile"
  return "$code"
}
