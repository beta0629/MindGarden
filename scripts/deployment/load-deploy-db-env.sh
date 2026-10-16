#!/usr/bin/env bash
# 배포 SSH 세션용 DB_* 해석 헬퍼 (source 전용).
#
# 해석 순서 (이미 non-empty 인 DB_* 는 덮어쓰지 않음):
#   1) MG_DEPLOY_ENV_FILE 에서 KEY=VALUE 만 grep/sed (전체 source 금지)
#      — 기본 /etc/mindgarden/prod.env
#      — DB_* 비어 있으면 DEV_DB_* 별칭도 동일 파일에서 시도
#   2) 비어 있는 DB_* 만 systemd unit Environment 로 채움
#      — MG_DEPLOY_SYSTEMD_UNITS (공백 구분)
#   3) 비밀번호 폴백: MG_DEPLOY_DB_PASSWORD_FALLBACK → PRODUCTION_DB_PASSWORD → DEV_DB_PASSWORD
#   4) 기본값: host=MG_LOCAL_DB_HOST/127.0.0.1, user=mindgarden, name=core_solution, port=3306
#
# export: DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME
# 비밀번호·값 echo 금지. 키 존재(set/empty)만 로그.
#
# MG_DEPLOY_ENV_FILE_REQUIRED=1 이고 env 파일이 없으면 exit 1.
#
# shellcheck disable=SC2034
set -euo pipefail

_MG_DEPLOY_ENV_FILE="${MG_DEPLOY_ENV_FILE:-/etc/mindgarden/prod.env}"

_mg_log_key_status() {
  local key="$1"
  local val="${!key-}"
  if [ -n "$val" ]; then
    echo "   ${key}=set"
  else
    echo "   ${key}=(empty)"
  fi
}

_mg_read_env_file_key() {
  # $1=KEY → stdout=value (따옴표·CRLF 제거). 없으면 빈 출력.
  local key="$1"
  local file="$2"
  local raw val
  if [ ! -f "$file" ]; then
    return 0
  fi
  if [ -r "$file" ]; then
    if ! grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$file" 2>/dev/null; then
      return 0
    fi
    raw=$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | tail -n1 | sed -n 's/^[^=]*=//p' | tr -d '\r')
  elif command -v sudo >/dev/null 2>&1; then
    if ! sudo grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$file" 2>/dev/null; then
      return 0
    fi
    raw=$(sudo grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | tail -n1 | sed -n 's/^[^=]*=//p' | tr -d '\r')
  else
    return 0
  fi
  val=$(printf '%s' "${raw:-}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  val=$(printf '%s' "$val" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  printf '%s' "$val"
}

_mg_fill_if_empty() {
  # $1=TARGET_VAR $2=value — target 이 비어 있고 value 가 non-empty 일 때만 설정
  local target="$1"
  local value="${2:-}"
  local current="${!target-}"
  if [ -z "$current" ] && [ -n "$value" ]; then
    printf -v "$target" '%s' "$value"
  fi
}

_mg_fill_from_env_file() {
  local target="$1"
  shift
  local key val
  local current="${!target-}"
  if [ -n "$current" ]; then
    return 0
  fi
  for key in "$@"; do
    val="$(_mg_read_env_file_key "$key" "$_MG_DEPLOY_ENV_FILE")"
    if [ -n "$val" ]; then
      printf -v "$target" '%s' "$val"
      return 0
    fi
  done
}

echo "🔧 load-deploy-db-env: env_file=${_MG_DEPLOY_ENV_FILE}"

if [ ! -f "$_MG_DEPLOY_ENV_FILE" ]; then
  if [ "${MG_DEPLOY_ENV_FILE_REQUIRED:-0}" = "1" ]; then
    echo "❌ load-deploy-db-env: required env file missing: ${_MG_DEPLOY_ENV_FILE}" >&2
    exit 1
  fi
  echo "   env file missing (optional) — continue"
else
  echo "   env file present"
fi

# 1) env 파일 (DB_* 우선, 비어 있으면 DEV_DB_* 별칭)
_mg_fill_from_env_file DB_HOST DB_HOST DEV_DB_HOST
_mg_fill_from_env_file DB_PORT DB_PORT DEV_DB_PORT
_mg_fill_from_env_file DB_USERNAME DB_USERNAME DEV_DB_USERNAME DEV_DB_USER
_mg_fill_from_env_file DB_PASSWORD DB_PASSWORD DEV_DB_PASSWORD
_mg_fill_from_env_file DB_NAME DB_NAME DEV_DB_NAME

# 2) systemd Environment (비어 있는 DB_* 만)
if [ -n "${MG_DEPLOY_SYSTEMD_UNITS:-}" ]; then
  echo "   systemd units: ${MG_DEPLOY_SYSTEMD_UNITS}"
  # shellcheck disable=SC2086
  for _mg_unit in ${MG_DEPLOY_SYSTEMD_UNITS}; do
    for kv in $(systemctl show "$_mg_unit" -p Environment --value 2>/dev/null | tr ' ' '\n' | grep '^DB_' || true); do
      _mg_k="${kv%%=*}"
      _mg_v="${kv#*=}"
      case "$_mg_k" in
        DB_HOST|DB_PORT|DB_USERNAME|DB_PASSWORD|DB_NAME)
          _mg_fill_if_empty "$_mg_k" "$_mg_v"
          ;;
        *)
          ;;
      esac
    done
  done
fi

# 3) 비밀번호 폴백
if [ -z "${DB_PASSWORD:-}" ]; then
  if [ -n "${MG_DEPLOY_DB_PASSWORD_FALLBACK:-}" ]; then
    DB_PASSWORD="$MG_DEPLOY_DB_PASSWORD_FALLBACK"
  elif [ -n "${PRODUCTION_DB_PASSWORD:-}" ]; then
    DB_PASSWORD="$PRODUCTION_DB_PASSWORD"
  elif [ -n "${DEV_DB_PASSWORD:-}" ]; then
    DB_PASSWORD="$DEV_DB_PASSWORD"
  fi
fi

# 4) 기본값
DB_HOST="${DB_HOST:-${MG_LOCAL_DB_HOST:-127.0.0.1}}"
DB_PORT="${DB_PORT:-3306}"
DB_USERNAME="${DB_USERNAME:-mindgarden}"
DB_NAME="${DB_NAME:-core_solution}"

export DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME

echo "   resolved host=${DB_HOST} port=${DB_PORT} user=${DB_USERNAME} db=${DB_NAME}"
_mg_log_key_status DB_PASSWORD
