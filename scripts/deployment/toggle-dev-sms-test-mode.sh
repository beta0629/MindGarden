#!/usr/bin/env bash
# =============================================================================
# toggle-dev-sms-test-mode.sh — .dev 전용 SMS_TEST_MODE ON/OFF
# -----------------------------------------------------------------------------
# /etc/mindgarden/dev.env 의 SMS_TEST_MODE 만 true|false 로 upsert 하고
# (선택) mindgarden-dev.service 를 재시작해 실효 상태를 확인한다.
#
# 금지:
#   - prod.env / prod 경로 / 임의 host·unit·key
#   - SMS_MOCK_CODE 변경·값 로그
#   - SSH / sync-solapi-sms-env.sh / prod-env-sync
#
# 실제 쓰기에는 --apply 필수. 없으면 dry-run(예정 MODE 만 출력).
# =============================================================================
set -euo pipefail

readonly ALLOWED_ENV_BASENAME="dev.env"
readonly DEFAULT_ENV_FILE="/etc/mindgarden/dev.env"
readonly ALLOWED_UNIT="mindgarden-dev.service"
readonly TARGET_KEY="SMS_TEST_MODE"
readonly MOCK_KEY="SMS_MOCK_CODE"
readonly HEALTH_URL="http://127.0.0.1:8080/actuator/health"

MODE=""
ENV_FILE="${DEFAULT_ENV_FILE}"
DO_APPLY=0
DO_RESTART=0
EXPLICIT_DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: toggle-dev-sms-test-mode.sh --mode true|false [--env-file /etc/mindgarden/dev.env]
                                   [--restart|--no-restart] [--dry-run] [--apply]

  --mode       Required. Exactly true or false.
  --env-file   Default /etc/mindgarden/dev.env. Basename must be dev.env; path must not contain prod.
  --apply      Required for real write. Without it, dry-run only.
  --dry-run    Explicit dry-run (default when --apply is absent).
  --restart    After --apply, restart mindgarden-dev.service and probe health.
  --no-restart Do not restart (default).
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

# path: absolute, basename=dev.env, no 'prod' substring (case-insensitive).
validate_env_file() {
  local f="$1"
  local base lower

  if [[ -z "$f" ]]; then
    die "env-file is empty"
  fi
  if [[ "$f" != /* ]]; then
    die "env-file must be an absolute path (got relative)"
  fi
  # Reject path tricks that still contain prod before basename check.
  lower="$(printf '%s' "$f" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    *prod*)
      die "env-file path must not contain 'prod' (got basename=$(basename "$f"))"
      ;;
  esac
  base="$(basename -- "$f")"
  if [[ "$base" != "$ALLOWED_ENV_BASENAME" ]]; then
    die "env-file basename must be ${ALLOWED_ENV_BASENAME} (got ${base})"
  fi
}

# Strip CR; unwrap matching single/double quotes around value.
unquote_env_value() {
  local raw="$1"
  raw="$(printf '%s' "$raw" | tr -d '\r')"
  case "$raw" in
    \"*\") raw="${raw#\"}"; raw="${raw%\"}" ;;
    \'*\') raw="${raw#\'}"; raw="${raw%\'}" ;;
  esac
  printf '%s' "$raw"
}

# Read KEY=value from file (last match). Prints value only (never logs caller secrets).
# Uses sudo cat when needed. Empty if missing.
read_env_key() {
  local file="$1" key="$2"
  local line="" raw=""

  if [[ -r "$file" ]]; then
    line="$(grep -E "^[[:space:]]*${key}=" "$file" 2>/dev/null | tail -n1 || true)"
  elif command -v sudo >/dev/null 2>&1 && sudo test -f "$file" 2>/dev/null; then
    line="$(sudo grep -E "^[[:space:]]*${key}=" "$file" 2>/dev/null | tail -n1 || true)"
  elif [[ -f "$file" ]]; then
    line="$(grep -E "^[[:space:]]*${key}=" "$file" 2>/dev/null | tail -n1 || true)"
  fi

  if [[ -z "$line" ]]; then
    printf ''
    return 0
  fi
  raw="${line#*=}"
  unquote_env_value "$raw"
}

file_exists() {
  local file="$1"
  if [[ -f "$file" ]]; then
    return 0
  fi
  if command -v sudo >/dev/null 2>&1 && sudo test -f "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

read_file_contents() {
  local file="$1"
  if [[ -r "$file" ]]; then
    cat -- "$file"
  elif command -v sudo >/dev/null 2>&1 && sudo test -f "$file" 2>/dev/null; then
    sudo cat -- "$file"
  else
    cat -- "$file"
  fi
}

# Upsert TARGET_KEY into stdin → stdout. Other keys preserved (including MOCK_KEY).
upsert_mode_content() {
  local mode="$1"
  local found=0
  local line
  local re="^[[:space:]]*${TARGET_KEY}="

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Match optional whitespace + KEY=... (regex in var: avoid [[ =~ ]] '=' parse pitfalls)
    if [[ "$line" =~ $re ]]; then
      printf '%s=%s\n' "$TARGET_KEY" "$mode"
      found=1
    else
      printf '%s\n' "$line"
    fi
  done
  if [[ "$found" -eq 0 ]]; then
    printf '%s=%s\n' "$TARGET_KEY" "$mode"
  fi
}

install_atomic() {
  local src="$1" dest="$2" backup="$3"
  local dest_dir
  dest_dir="$(dirname -- "$dest")"

  if [[ -w "$dest_dir" ]] && { [[ ! -e "$dest" ]] || [[ -w "$dest" ]]; }; then
    cp -- "$dest" "$backup"
    # Preserve mode when possible; force 600 after replace.
    if command -v install >/dev/null 2>&1; then
      install -m 600 "$src" "$dest"
      rm -f -- "$src"
    else
      mv -- "$src" "$dest"
      chmod 600 "$dest" 2>/dev/null || true
    fi
    return 0
  fi

  if ! command -v sudo >/dev/null 2>&1; then
    die "cannot write ${dest} (no write permission and no sudo)"
  fi
  sudo cp -- "$dest" "$backup"
  if sudo bash -c 'command -v install >/dev/null 2>&1'; then
    sudo install -m 600 "$src" "$dest"
    rm -f -- "$src" 2>/dev/null || sudo rm -f -- "$src"
  else
    sudo mv -- "$src" "$dest"
    sudo chmod 600 "$dest" 2>/dev/null || true
  fi
}

print_readback() {
  local file="$1"
  local effective mock_val mock_present mock_len

  effective="$(read_env_key "$file" "$TARGET_KEY")"
  case "$effective" in
    true|false)
      echo "EFFECTIVE_FILE_SMS_TEST_MODE=${effective}"
      ;;
    "")
      echo "EFFECTIVE_FILE_SMS_TEST_MODE="
      ;;
    *)
      # Fail-closed on unexpected values — do not echo raw.
      echo "EFFECTIVE_FILE_SMS_TEST_MODE=invalid"
      ;;
  esac

  mock_val="$(read_env_key "$file" "$MOCK_KEY")"
  if [[ -n "$mock_val" ]]; then
    mock_present="yes"
    mock_len="${#mock_val}"
  else
    mock_present="no"
    mock_len=0
  fi
  echo "SMS_MOCK_CODE_PRESENT=${mock_present}"
  echo "SMS_MOCK_CODE_LEN=${mock_len}"
}

# Fail-closed colocated .dev probe: unit file on disk or systemctl cat.
is_unit_present() {
  local unit="$ALLOWED_UNIT"
  local p
  for p in \
    "/etc/systemd/system/${unit}" \
    "/lib/systemd/system/${unit}" \
    "/usr/lib/systemd/system/${unit}"
  do
    if [[ -f "$p" ]]; then
      return 0
    fi
    if command -v sudo >/dev/null 2>&1 && sudo test -f "$p" 2>/dev/null; then
      return 0
    fi
  done
  if command -v systemctl >/dev/null 2>&1; then
    if systemctl cat "$unit" >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

do_restart_and_probe() {
  local unit="$ALLOWED_UNIT"
  echo "RESTART_UNIT=${unit}"
  if ! command -v systemctl >/dev/null 2>&1; then
    die "systemctl not available; cannot restart ${unit}"
  fi
  # Prefer PATH systemctl first (fixture mocks / already-privileged). Fall back to sudo.
  if ! systemctl restart "$unit" 2>/dev/null; then
    if command -v sudo >/dev/null 2>&1; then
      sudo systemctl restart "$unit"
    else
      die "systemctl restart ${unit} failed (no sudo)"
    fi
  fi
  local active=""
  active="$(systemctl is-active "$unit" 2>/dev/null || true)"
  echo "UNIT_ACTIVE=${active}"
  if [[ "$active" != "active" ]]; then
    die "${unit} is not active after restart (is-active=${active})"
  fi
  if command -v curl >/dev/null 2>&1; then
    if curl -sf --max-time 15 "$HEALTH_URL" >/dev/null; then
      echo "HEALTH_PROBE=ok"
    else
      echo "HEALTH_PROBE=fail"
      die "health probe failed: ${HEALTH_URL}"
    fi
  else
    echo "HEALTH_PROBE=skipped_no_curl"
  fi
}

# --- argv ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      [[ $# -ge 2 ]] || die "--mode requires true|false"
      MODE="$2"
      shift 2
      ;;
    --env-file)
      [[ $# -ge 2 ]] || die "--env-file requires a path"
      ENV_FILE="$2"
      shift 2
      ;;
    --apply)
      DO_APPLY=1
      shift
      ;;
    --dry-run)
      EXPLICIT_DRY_RUN=1
      shift
      ;;
    --restart)
      DO_RESTART=1
      shift
      ;;
    --no-restart)
      DO_RESTART=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

if [[ -z "$MODE" ]]; then
  die "--mode is required (true|false)"
fi
case "$MODE" in
  true|false) ;;
  *)
    die "--mode must be exactly true or false (got length=${#MODE})"
    ;;
esac

if [[ "$DO_APPLY" -eq 1 && "$EXPLICIT_DRY_RUN" -eq 1 ]]; then
  die "cannot combine --apply and --dry-run"
fi

validate_env_file "$ENV_FILE"

echo "TARGET_KEY=${TARGET_KEY}"
echo "MODE=${MODE}"
echo "ENV_FILE=${ENV_FILE}"
echo "UNIT=${ALLOWED_UNIT}"
echo "APPLY=${DO_APPLY}"
echo "RESTART=${DO_RESTART}"

if ! file_exists "$ENV_FILE"; then
  die "env file not found: ${ENV_FILE}. Runner must be colocated on .dev host with access to ${DEFAULT_ENV_FILE}. No SSH fallback."
fi

echo "--- readback (before) ---"
print_readback "$ENV_FILE"

UNIT_PRESENT=no
if is_unit_present; then
  UNIT_PRESENT=yes
fi
echo "UNIT_PRESENT=${UNIT_PRESENT}"

if [[ "$DO_APPLY" -ne 1 ]]; then
  echo "DRY_RUN=1"
  echo "PLANNED_SMS_TEST_MODE=${MODE}"
  echo "NO_WRITE=1"
  if [[ "$DO_RESTART" -eq 1 ]]; then
    echo "PLANNED_RESTART=1 (skipped: dry-run)"
  fi
  if [[ "$UNIT_PRESENT" != "yes" ]]; then
    echo "WARN: ${ALLOWED_UNIT} not found on this host (wrong host / not colocated .dev). dry-run only."
  fi
  echo "OK dry-run complete (no file changes)"
  exit 0
fi

# --apply: refuse write unless unit exists (colocated .dev host).
if [[ "$UNIT_PRESENT" != "yes" ]]; then
  die "${ALLOWED_UNIT} not found on this host (wrong host / not colocated .dev). Refusing --apply."
fi

TMPDIR_USE="${TMPDIR:-/tmp}"
TMP_OUT="$(mktemp "${TMPDIR_USE}/dev.env.toggle.XXXXXX")"
BACKUP=""
cleanup_tmp() {
  rm -f "$TMP_OUT" 2>/dev/null || true
}
trap cleanup_tmp EXIT

TS="$(date +%Y%m%d%H%M%S)"
BACKUP="${ENV_FILE}.bak.${TS}"

if ! read_file_contents "$ENV_FILE" | upsert_mode_content "$MODE" >"$TMP_OUT"; then
  die "failed to build updated env content"
fi
chmod 600 "$TMP_OUT" 2>/dev/null || true

if ! install_atomic "$TMP_OUT" "$ENV_FILE" "$BACKUP"; then
  echo "RESTORE_HINT=restore from backup if present: ${BACKUP}" >&2
  die "atomic install failed for ${ENV_FILE}"
fi
# install may have moved/consumed TMP_OUT
TMP_OUT=""
trap - EXIT

echo "BACKUP=${BACKUP}"
echo "--- readback (after) ---"
print_readback "$ENV_FILE"

effective_after="$(read_env_key "$ENV_FILE" "$TARGET_KEY")"
if [[ "$effective_after" != "$MODE" ]]; then
  echo "RESTORE_HINT=cp ${BACKUP} ${ENV_FILE}  # then systemctl restart ${ALLOWED_UNIT}" >&2
  die "readback mismatch: expected MODE=${MODE}"
fi

if [[ "$DO_RESTART" -eq 1 ]]; then
  if ! do_restart_and_probe; then
    echo "RESTORE_HINT=cp ${BACKUP} ${ENV_FILE} && systemctl restart ${ALLOWED_UNIT}" >&2
    exit 1
  fi
else
  echo "RESTART=skipped"
fi

echo "OK SMS_TEST_MODE=${MODE} applied to ${ENV_FILE}"
exit 0
