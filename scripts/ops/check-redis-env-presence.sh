#!/usr/bin/env bash
# Read-only REDIS_* presence check for /etc/mindgarden/*.env
# Prints SET | EMPTY/MISSING for REDIS_HOST / REDIS_PORT / REDIS_PASSWORD only.
# Optional redis-cli ping → PONG | FAIL | NO_REDIS_CLI | SKIP_HOST_NOT_SET.
# Section 3) per-host redis discovery (process/systemd/docker/listen) — names/status/bind only.
#   redis_docker: NO_DOCKER if docker CLI missing; NONE if docker ok but no redis containers.
# NEVER prints secret values. NEVER restarts services or modifies files.
#
# Usage: bash check-redis-env-presence.sh [host_role_label]
# Env:   MG_REDIS_CHECK_ENV_DIR (default /etc/mindgarden) — override for local dry-run.

set +e
set -u

HOST_ROLE="${1:-unknown}"
ENV_DIR="${MG_REDIS_CHECK_ENV_DIR:-/etc/mindgarden}"
# Track whether any checked *.env had REDIS_HOST=SET (for env_draft_hint).
ANY_REDIS_HOST_SET=0

echo "=========================================="
echo "REDIS_* presence check (read-only)"
echo "host_role=${HOST_ROLE}"
echo "env_dir=${ENV_DIR}"
echo "=========================================="
echo "NO values, NO restart, NO deploy."
echo ""

# Prefer sudo for host paths; fall back when files are readable (local fixture tests).
_test_f() {
  if command -v sudo >/dev/null 2>&1 && sudo test -f "$1" 2>/dev/null; then
    return 0
  fi
  test -f "$1"
}

_test_d() {
  if command -v sudo >/dev/null 2>&1 && sudo test -d "$1" 2>/dev/null; then
    return 0
  fi
  test -d "$1"
}

_grep_key_line() {
  # $1=file $2=KEY — one matching KEY= line or empty (stdout only; may contain secret)
  local env_file="$1"
  local key="$2"
  if command -v sudo >/dev/null 2>&1 && sudo test -f "$env_file" 2>/dev/null; then
    sudo grep -E "^${key}=" "$env_file" 2>/dev/null | head -n 1 || true
  else
    grep -E "^${key}=" "$env_file" 2>/dev/null | head -n 1 || true
  fi
}

_strip_value() {
  # stdin: KEY=value → stdout: value without surrounding quotes/CR (may be secret)
  local line raw
  line="$(cat)"
  raw="${line#*=}"
  raw="$(printf '%s' "$raw" | tr -d '\r')"
  case "$raw" in
    \"*\") raw="${raw#\"}"; raw="${raw%\"}" ;;
    \'*\') raw="${raw#\'}"; raw="${raw%\'}" ;;
  esac
  printf '%s' "$raw"
}

redis_key_presence() {
  # $1=env_file $2=KEY → prints SET | EMPTY/MISSING (never the value)
  local env_file="$1"
  local key="$2"
  local line raw
  line="$(_grep_key_line "$env_file" "$key")"
  if [ -z "$line" ]; then
    echo "EMPTY/MISSING"
    return 0
  fi
  raw="$(printf '%s\n' "$line" | _strip_value)"
  if [ -z "$raw" ]; then
    echo "EMPTY/MISSING"
  else
    echo "SET"
  fi
}

load_env_key_quiet() {
  # $1=env_file $2=KEY $3=varname — assign without printing
  local env_file="$1"
  local key="$2"
  local varname="$3"
  local line raw
  line="$(_grep_key_line "$env_file" "$key")"
  raw=""
  if [ -n "$line" ]; then
    raw="$(printf '%s\n' "$line" | _strip_value)"
  fi
  eval "$varname=\"\$raw\""
}

check_one_env_file() {
  local env_file="$1"
  echo "------------------------------------------"
  echo "env_file=${env_file}"
  if ! _test_f "$env_file"; then
    echo "file=MISSING"
    echo "------------------------------------------"
    return 0
  fi
  echo "file=PRESENT"

  local host_status port_status pass_status
  host_status="$(redis_key_presence "$env_file" REDIS_HOST)"
  port_status="$(redis_key_presence "$env_file" REDIS_PORT)"
  pass_status="$(redis_key_presence "$env_file" REDIS_PASSWORD)"
  echo "REDIS_HOST=${host_status}"
  echo "REDIS_PORT=${port_status}"
  echo "REDIS_PASSWORD=${pass_status}"

  if [ "$host_status" = "SET" ]; then
    ANY_REDIS_HOST_SET=1
  fi

  # Host must be SET before attempting ping (user contract).
  if [ "$host_status" != "SET" ]; then
    echo "redis_cli_ping=SKIP_HOST_NOT_SET"
    echo "------------------------------------------"
    return 0
  fi

  if ! command -v redis-cli >/dev/null 2>&1; then
    echo "redis_cli_ping=NO_REDIS_CLI"
    echo "------------------------------------------"
    return 0
  fi

  local REDIS_HOST_V="" REDIS_PORT_V="" REDIS_PASSWORD_V=""
  load_env_key_quiet "$env_file" REDIS_HOST REDIS_HOST_V
  load_env_key_quiet "$env_file" REDIS_PORT REDIS_PORT_V
  load_env_key_quiet "$env_file" REDIS_PASSWORD REDIS_PASSWORD_V
  if [ -z "${REDIS_PORT_V}" ]; then
    REDIS_PORT_V="6379"
  fi

  # Prefer REDISCLI_AUTH so password is not on argv; never echo.
  export REDISCLI_AUTH="${REDIS_PASSWORD_V}"
  unset REDIS_PASSWORD_V
  local ping_out
  ping_out="$(redis-cli -h "${REDIS_HOST_V}" -p "${REDIS_PORT_V}" --no-auth-warning ping 2>/dev/null | tr -d '\r')"
  unset REDISCLI_AUTH
  unset REDIS_HOST_V REDIS_PORT_V
  if [ "$ping_out" = "PONG" ]; then
    echo "redis_cli_ping=PONG"
  else
    echo "redis_cli_ping=FAIL"
  fi
  echo "------------------------------------------"
}

# --- Section 3 helpers (read-only; never print secrets / cmdline / env) ---

_discover_redis_process() {
  # Process name match only — no pgrep -a (would leak cmdline).
  if ! command -v pgrep >/dev/null 2>&1; then
    echo "NO"
    return 0
  fi
  if pgrep -x redis-server >/dev/null 2>&1 || pgrep -x redis-sentinel >/dev/null 2>&1; then
    echo "YES"
  else
    echo "NO"
  fi
}

_discover_redis_systemd() {
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "NONE"
    return 0
  fi
  local units unit_names=""
  # Unit names only; no timestamps/descriptions.
  units="$(systemctl list-units 'redis*' --all --no-legend --no-pager 2>/dev/null || true)"
  if [ -z "$units" ]; then
    echo "NONE"
    return 0
  fi
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    # Skip optional leading bullet; take first token that looks like a unit name.
    set -- $line
    local name="" tok
    for tok in "$@"; do
      case "$tok" in
        *.service|*.socket|*.target|*.timer)
          name="$tok"
          break
          ;;
        redis*|Redis*|REDIS*)
          name="$tok"
          break
          ;;
      esac
    done
    [ -z "$name" ] && continue
    case " $unit_names " in
      *" $name "*) continue ;;
    esac
    if [ -z "$unit_names" ]; then
      unit_names="$name"
    else
      unit_names="$unit_names $name"
    fi
  done <<EOF
$units
EOF
  if [ -z "$unit_names" ]; then
    echo "NONE"
  else
    echo "$unit_names"
  fi
}

_discover_redis_docker() {
  # NO_DOCKER if CLI missing; NONE if docker ok but no redis-related containers.
  if ! command -v docker >/dev/null 2>&1; then
    echo "NO_DOCKER"
    return 0
  fi
  local rows=""
  # name<TAB>status<TAB>image — never Env.
  rows="$(docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}' 2>/dev/null || true)"
  if [ -z "$rows" ]; then
    echo "NONE"
    return 0
  fi
  # First word of Status (Up/Exited); space-separated name:status pairs.
  local pairs
  pairs="$(printf '%s\n' "$rows" | awk -F '\t' '
    {
      key = tolower($1 "|" $3)
      if (index(key, "redis") == 0) next
      split($2, st, /[ \t]+/)
      word = (st[1] == "" ? "unknown" : st[1])
      if (out != "") out = out " "
      out = out $1 ":" word
    }
    END { if (out == "") print "NONE"; else print out }
  ')"
  echo "${pairs:-NONE}"
}

_listen_binds_for_port() {
  # $1=port → space-separated address:port binds, or empty if none.
  # Prefer ss -ltn; fallback netstat -ltn. Address:port only (no process owner).
  local port="$1"
  local raw="" binds="" candidate
  if command -v ss >/dev/null 2>&1; then
    raw="$(ss -ltn 2>/dev/null || true)"
  elif command -v netstat >/dev/null 2>&1; then
    raw="$(netstat -ltn 2>/dev/null || true)"
  else
    printf ''
    return 0
  fi
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    # Only real listen rows (skip headers like State/Proto/Active).
    case "$line" in
      *LISTEN*|*Listen*) ;;
      *) continue ;;
    esac
    # Extract local address:port tokens that end with :PORT.
    for candidate in $line; do
      case "$candidate" in
        *":${port}")
          case " $binds " in
            *" $candidate "*) continue ;;
          esac
          if [ -z "$binds" ]; then
            binds="$candidate"
          else
            binds="$binds $candidate"
          fi
          ;;
      esac
    done
  done <<EOF
$raw
EOF
  printf '%s' "$binds"
}

run_per_host_redis_discovery() {
  echo "3) per-host redis discovery (read-only; no secrets)"
  echo "=========================================="

  local redis_process redis_systemd redis_docker
  redis_process="$(_discover_redis_process)"
  redis_systemd="$(_discover_redis_systemd)"
  redis_docker="$(_discover_redis_docker)"

  echo "redis_process=${redis_process}"
  echo "redis_systemd=${redis_systemd}"
  echo "redis_docker=${redis_docker}"

  local binds_6379 binds_6380
  binds_6379="$(_listen_binds_for_port 6379)"
  binds_6380="$(_listen_binds_for_port 6380)"

  if [ -n "$binds_6379" ]; then
    echo "listen_6379=YES bind=${binds_6379}"
  else
    echo "listen_6379=NO"
  fi
  if [ -n "$binds_6380" ]; then
    echo "listen_6380=YES bind=${binds_6380}"
  else
    echo "listen_6380=NO"
  fi

  # Hint only when a redis port is listening AND no checked env had REDIS_HOST=SET.
  if { [ -n "$binds_6379" ] || [ -n "$binds_6380" ]; } && [ "${ANY_REDIS_HOST_SET}" -eq 0 ]; then
    echo "env_draft_hint=REDIS_HOST=127.0.0.1 REDIS_PORT=6379 REDIS_PASSWORD=<SET_IN_ENV_FILE_NOT_HERE>"
  fi
}

echo "1) discover ${ENV_DIR}/*.env (names only)"
echo "=========================================="
if _test_d "${ENV_DIR}"; then
  # Basenames only — never cat file contents
  if ls -1 "${ENV_DIR}"/*.env >/dev/null 2>&1; then
    ls -1 "${ENV_DIR}"/*.env 2>/dev/null | xargs -n1 basename 2>/dev/null | sort -u
  elif command -v sudo >/dev/null 2>&1 && sudo ls -1 "${ENV_DIR}"/*.env >/dev/null 2>&1; then
    sudo ls -1 "${ENV_DIR}"/*.env 2>/dev/null | xargs -n1 basename 2>/dev/null | sort -u
  else
    echo "(no *.env found)"
  fi
else
  echo "MISSING_DIR=${ENV_DIR}"
fi
echo ""

echo "2) per-file REDIS_* presence + optional ping"
echo "=========================================="
DECLARED_FILES="${ENV_DIR}/prod.env ${ENV_DIR}/dev.env"
EXTRA_FILES=""
if _test_d "${ENV_DIR}"; then
  if ls -1 "${ENV_DIR}"/*.env >/dev/null 2>&1; then
    EXTRA_FILES="$(ls -1 "${ENV_DIR}"/*.env 2>/dev/null || true)"
  elif command -v sudo >/dev/null 2>&1; then
    EXTRA_FILES="$(sudo ls -1 "${ENV_DIR}"/*.env 2>/dev/null || true)"
  fi
fi

SEEN=""
for env_file in $DECLARED_FILES $EXTRA_FILES; do
  case " $SEEN " in
    *" $env_file "*) continue ;;
  esac
  SEEN="$SEEN $env_file"
  check_one_env_file "$env_file"
done

echo ""
run_per_host_redis_discovery

echo ""
echo "done (read-only)."
exit 0
