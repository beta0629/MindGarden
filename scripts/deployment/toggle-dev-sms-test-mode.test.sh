#!/usr/bin/env bash
# toggle-dev-sms-test-mode.sh 자가 테스트 (tempfile fixture · systemctl mock)
# 스타일: deploy-checks.test.sh 의 ok - / not ok -
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$DIR/toggle-dev-sms-test-mode.sh"
fail=0
LAST_OUT=""

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/mg-sms-toggle-test.XXXXXX")"
MOCK_BIN="$WORKDIR/bin"
mkdir -p "$MOCK_BIN"

cleanup() {
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

check() {
  local name="$1" expected="$2"
  shift 2
  local out code=0
  out="$("$@" 2>&1)" || code=$?
  if [[ "$code" = "$expected" ]]; then
    echo "ok - $name"
  else
    echo "not ok - $name (exit $code, expected $expected)"
    printf '    %s\n' "${out//$'\n'/$'\n'    }"
    fail=1
  fi
  LAST_OUT="$out"
}

assert_grep() {
  local name="$1" pattern="$2"
  if printf '%s\n' "$LAST_OUT" | grep -Eq -- "$pattern"; then
    echo "ok - $name"
  else
    echo "not ok - $name (pattern not found: $pattern)"
    printf '    %s\n' "${LAST_OUT//$'\n'/$'\n'    }"
    fail=1
  fi
}

assert_not_grep() {
  local name="$1" pattern="$2"
  if printf '%s\n' "$LAST_OUT" | grep -Eq -- "$pattern"; then
    echo "not ok - $name (forbidden pattern matched: $pattern)"
    printf '    %s\n' "${LAST_OUT//$'\n'/$'\n'    }"
    fail=1
  else
    echo "ok - $name"
  fi
}

# --- syntax ---
check "bash -n script" 0 bash -n "$SCRIPT"

# --- fixture helpers ---
write_fixture() {
  local path="$1"
  cat >"$path"
  chmod 600 "$path"
}

FIXTURE_DIR="$WORKDIR/etc-mindgarden"
mkdir -p "$FIXTURE_DIR"
FIXTURE="$FIXTURE_DIR/dev.env"

write_fixture "$FIXTURE" <<'EOF'
# mindgarden dev env fixture
REDIS_HOST=127.0.0.1
SMS_TEST_MODE=false
SMS_MOCK_CODE=secret-mock-9999
UNRELATED_KEY=keep-me
EOF

# --- malformed mode ---
check "malformed mode rejected" 1 bash "$SCRIPT" --mode yes --env-file "$FIXTURE"
check "empty-like mode rejected" 1 bash "$SCRIPT" --mode TRUE --env-file "$FIXTURE"
check "missing mode rejected" 1 bash "$SCRIPT" --env-file "$FIXTURE"

# --- prod path / prod.env ---
check "prod.env rejected" 1 bash "$SCRIPT" --mode true --env-file /etc/mindgarden/prod.env
check "path containing prod rejected" 1 bash "$SCRIPT" --mode true --env-file /var/prod/mindgarden/dev.env
check "production path rejected" 1 bash "$SCRIPT" --mode false --env-file /tmp/production/dev.env

# --- arbitrary path ---
check "arbitrary .env basename rejected" 1 bash "$SCRIPT" --mode true --env-file "$WORKDIR/other.env"
printf 'SMS_TEST_MODE=false\n' >"$WORKDIR/other.env"
check "relative path rejected" 1 bash "$SCRIPT" --mode true --env-file "./dev.env"

# --- dry-run does not write; --apply required ---
BEFORE_HASH="$(cksum "$FIXTURE" | awk '{print $1" "$2}')"
check "dry-run default (no --apply)" 0 bash "$SCRIPT" --mode true --env-file "$FIXTURE"
assert_grep "dry-run marker" '^DRY_RUN=1$'
assert_grep "planned mode true" '^PLANNED_SMS_TEST_MODE=true$'
assert_not_grep "no mock plaintext on dry-run" 'secret-mock-9999'
assert_grep "mock present yes" '^SMS_MOCK_CODE_PRESENT=yes$'
assert_grep "mock len only" '^SMS_MOCK_CODE_LEN=16$'
AFTER_HASH="$(cksum "$FIXTURE" | awk '{print $1" "$2}')"
if [[ "$BEFORE_HASH" = "$AFTER_HASH" ]]; then
  echo "ok - dry-run does not modify file"
else
  echo "not ok - dry-run modified file"
  fail=1
fi

# Explicit --dry-run
check "explicit --dry-run" 0 bash "$SCRIPT" --mode false --env-file "$FIXTURE" --dry-run
assert_grep "explicit dry-run marker" '^DRY_RUN=1$'

# --apply + --dry-run conflict
check "apply+dry-run conflict" 1 bash "$SCRIPT" --mode true --env-file "$FIXTURE" --apply --dry-run

# --- systemctl mocks: unit present (cat/restart) vs unit missing ---
MOCK_SYSTEMCTL_LOG="$WORKDIR/systemctl.log"
write_systemctl_present() {
  cat >"$MOCK_BIN/systemctl" <<'EOF'
#!/usr/bin/env bash
echo "mock-systemctl $*" >>"${MOCK_SYSTEMCTL_LOG:?}"
case "$1" in
  cat)
    # unit present on colocated .dev
    if [[ "${2:-}" == "mindgarden-dev.service" ]]; then
      echo "# mock unit"
      exit 0
    fi
    exit 1
    ;;
  restart) exit 0 ;;
  is-active) echo "active"; exit 0 ;;
  *) exit 0 ;;
esac
EOF
  chmod +x "$MOCK_BIN/systemctl"
}
write_systemctl_missing() {
  cat >"$MOCK_BIN/systemctl" <<'EOF'
#!/usr/bin/env bash
echo "mock-systemctl $*" >>"${MOCK_SYSTEMCTL_LOG:?}"
case "$1" in
  cat) exit 1 ;;
  restart) exit 0 ;;
  is-active) echo "inactive"; exit 0 ;;
  *) exit 1 ;;
esac
EOF
  chmod +x "$MOCK_BIN/systemctl"
}
cat >"$MOCK_BIN/curl" <<'EOF'
#!/usr/bin/env bash
# always succeed health probe in fixture
exit 0
EOF
chmod +x "$MOCK_BIN/curl"

# unit missing → --apply refused (before write)
write_systemctl_missing
: >"$MOCK_SYSTEMCTL_LOG"
BEFORE_MISSING="$(cksum "$FIXTURE" | awk '{print $1" "$2}')"
check "apply refused when unit missing" 1 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$FIXTURE" --apply --no-restart
assert_grep "unit present no on refuse" '^UNIT_PRESENT=no$'
assert_grep "wrong host message" 'wrong host / not colocated \.dev'
AFTER_MISSING="$(cksum "$FIXTURE" | awk '{print $1" "$2}')"
if [[ "$BEFORE_MISSING" = "$AFTER_MISSING" ]]; then
  echo "ok - unit-missing apply does not modify file"
else
  echo "not ok - unit-missing apply modified file"
  fail=1
fi

# dry-run with unit missing still passes (warn only)
check "dry-run ok when unit missing" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$FIXTURE" --dry-run
assert_grep "dry-run unit present no" '^UNIT_PRESENT=no$'
assert_grep "dry-run unit warn" 'WARN:.*wrong host / not colocated \.dev'

# --- ON upsert with --apply (unit present mock) ---
write_systemctl_present
: >"$MOCK_SYSTEMCTL_LOG"
check "apply mode true" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$FIXTURE" --apply --no-restart
assert_grep "effective true" '^EFFECTIVE_FILE_SMS_TEST_MODE=true$'
assert_grep "unit present yes on apply" '^UNIT_PRESENT=yes$'
assert_grep "mock still present" '^SMS_MOCK_CODE_PRESENT=yes$'
assert_not_grep "no mock plaintext after apply ON" 'secret-mock-9999'
if grep -q '^SMS_TEST_MODE=true$' "$FIXTURE"; then
  echo "ok - file has SMS_TEST_MODE=true"
else
  echo "not ok - file missing SMS_TEST_MODE=true"
  fail=1
fi
if grep -q '^SMS_MOCK_CODE=secret-mock-9999$' "$FIXTURE"; then
  echo "ok - SMS_MOCK_CODE unchanged after ON"
else
  echo "not ok - SMS_MOCK_CODE changed after ON"
  fail=1
fi
if grep -q '^UNRELATED_KEY=keep-me$' "$FIXTURE"; then
  echo "ok - unrelated key preserved after ON"
else
  echo "not ok - unrelated key lost after ON"
  fail=1
fi
if grep -q '^REDIS_HOST=127.0.0.1$' "$FIXTURE"; then
  echo "ok - REDIS_HOST preserved after ON"
else
  echo "not ok - REDIS_HOST lost after ON"
  fail=1
fi

# backup created
if ls "$FIXTURE".bak.* >/dev/null 2>&1; then
  echo "ok - backup file created"
else
  echo "not ok - backup file missing"
  fail=1
fi

# --- OFF upsert ---
check "apply mode false" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode false --env-file "$FIXTURE" --apply --no-restart
assert_grep "effective false" '^EFFECTIVE_FILE_SMS_TEST_MODE=false$'
if grep -q '^SMS_TEST_MODE=false$' "$FIXTURE"; then
  echo "ok - file has SMS_TEST_MODE=false"
else
  echo "not ok - file missing SMS_TEST_MODE=false"
  fail=1
fi
if grep -q '^SMS_MOCK_CODE=secret-mock-9999$' "$FIXTURE"; then
  echo "ok - SMS_MOCK_CODE unchanged after OFF"
else
  echo "not ok - SMS_MOCK_CODE changed after OFF"
  fail=1
fi

# --- append when key missing ---
NO_KEY="$FIXTURE_DIR/dev.env"
# reuse same basename path — rewrite without SMS_TEST_MODE
write_fixture "$NO_KEY" <<'EOF'
FOO=bar
SMS_MOCK_CODE=abc
EOF
check "append SMS_TEST_MODE when missing" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$NO_KEY" --apply --no-restart
if grep -q '^SMS_TEST_MODE=true$' "$NO_KEY" && grep -q '^FOO=bar$' "$NO_KEY"; then
  echo "ok - append preserves other keys"
else
  echo "not ok - append failed"
  fail=1
fi

# --- quoted existing value replaced ---
write_fixture "$FIXTURE" <<'EOF'
SMS_TEST_MODE="false"
SMS_MOCK_CODE="quoted-secret"
KEEP=1
EOF
check "replace quoted SMS_TEST_MODE" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$FIXTURE" --apply --no-restart
if grep -q '^SMS_TEST_MODE=true$' "$FIXTURE"; then
  echo "ok - quoted line replaced"
else
  echo "not ok - quoted line not replaced"
  fail=1
fi
assert_not_grep "no quoted-secret in output" 'quoted-secret'

# --- restart flag with unit-present mock ---
: >"$MOCK_SYSTEMCTL_LOG"
write_fixture "$FIXTURE" <<'EOF'
SMS_TEST_MODE=false
SMS_MOCK_CODE=x
EOF
check "apply with --restart uses mock systemctl" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$FIXTURE" --apply --restart
assert_grep "restart unit logged in output" '^RESTART_UNIT=mindgarden-dev.service$'
assert_grep "unit active" '^UNIT_ACTIVE=active$'
if grep -q 'restart mindgarden-dev.service' "$MOCK_SYSTEMCTL_LOG"; then
  echo "ok - systemctl restart invoked on allowlisted unit only"
else
  echo "not ok - systemctl restart not invoked"
  fail=1
fi

# dry-run + restart must not call systemctl restart (cat for presence probe is ok)
: >"$MOCK_SYSTEMCTL_LOG"
check "dry-run with --restart skips systemctl restart" 0 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode false --env-file "$FIXTURE" --restart
if grep -q 'restart mindgarden-dev.service' "$MOCK_SYSTEMCTL_LOG"; then
  echo "not ok - dry-run invoked systemctl restart"
  fail=1
else
  echo "ok - dry-run does not invoke systemctl restart"
fi

# missing file fail-closed
MISSING="$WORKDIR/missing-dir/dev.env"
check "missing env file fail-closed" 1 \
  env PATH="$MOCK_BIN:$PATH" MOCK_SYSTEMCTL_LOG="$MOCK_SYSTEMCTL_LOG" \
  bash "$SCRIPT" --mode true --env-file "$MISSING" --apply

if [[ "$fail" -ne 0 ]]; then
  echo "toggle-dev-sms-test-mode.test.sh FAIL"
  exit 1
fi
echo "toggle-dev-sms-test-mode.test.sh PASS"
exit 0
