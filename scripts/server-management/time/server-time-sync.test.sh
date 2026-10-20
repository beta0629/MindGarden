#!/usr/bin/env bash
# server-time-sync-lib.sh 자가 테스트 (root/네트워크 불필요)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=server-time-sync-lib.sh
. "$DIR/server-time-sync-lib.sh"

fail=0
LAST_OUT=""

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

assert_grep() {
  local name="$1" pattern="$2"
  if echo "$LAST_OUT" | grep -Eq "$pattern"; then
    echo "ok - $name"
  else
    echo "not ok - $name (pattern not found: $pattern)"
    printf '    %s\n' "${LAST_OUT//$'\n'/$'\n'    }"
    fail=1
  fi
}

assert_eq() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "ok - $name"
  else
    echo "not ok - $name (expected='$expected' actual='$actual')"
    fail=1
  fi
}

FIXTURE="$(mktemp -d)"
cleanup() { rm -rf "$FIXTURE"; }
trap cleanup EXIT

# --- mode validation ---
check "mode diagnose" 0 sts_validate_mode diagnose
assert_eq "diagnose 정규화" "diagnose" "$(echo "$LAST_OUT" | tail -1)"

check "mode apply" 0 sts_validate_mode apply
assert_eq "apply 정규화" "apply" "$(echo "$LAST_OUT" | tail -1)"

check "unknown mode → exit 2" 2 sts_validate_mode foobar
assert_grep "unknown 메시지" "알 수 없는 모드"

check "empty mode → exit 2" 2 sts_validate_mode ""

# --- HTTP Date extract / parse / skew ---
HEADERS=$'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nDate: Wed, 21 Oct 2026 12:00:00 GMT\r\nServer: test\r\n'
DATE_VAL=$(sts_extract_http_date_header "$HEADERS")
assert_eq "HTTP Date 추출" "Wed, 21 Oct 2026 12:00:00 GMT" "$DATE_VAL"

EPOCH=$(sts_http_date_to_epoch "$DATE_VAL")
assert_eq "HTTP Date → epoch" "1792584000" "$EPOCH"

check "bad date parse fail" 1 sts_http_date_to_epoch "not-a-date"

SKEW=$(sts_skew_seconds 1792584000 1792584010)
assert_eq "skew +10" "10" "$SKEW"
SKEW=$(sts_skew_seconds 1792584010 1792584000)
assert_eq "skew -10" "-10" "$SKEW"

HEADERS_NO=$'HTTP/1.1 200 OK\r\nServer: x\r\n'
if sts_extract_http_date_header "$HEADERS_NO" >/dev/null 2>&1; then
  echo "not ok - Date 없는 헤더는 실패해야 함"
  fail=1
else
  echo "ok - Date 없는 헤더 실패"
fi

# --- chrony managed block generation ---
check "chrony managed block 생성" 0 sts_generate_chrony_managed_block
assert_grep "BEGIN 마커" "BEGIN MINDGARDEN_TIME_SYNC"
assert_grep "END 마커" "END MINDGARDEN_TIME_SYNC"
assert_grep "server time.bora.net" '^server time\.bora\.net iburst$'
assert_grep "server kr.pool.ntp.org" '^server kr\.pool\.ntp\.org iburst$'
assert_grep "makestep disabled" '^makestep -1 -1$'
assert_grep "maxslewrate" '^maxslewrate 500$'

# --- idempotent conf write on fixture ---
CONF="$FIXTURE/chrony.conf"
cat > "$CONF" || true
printf '%s\n' '# existing hand config' 'pool 0.debian.pool.ntp.org iburst' 'makestep 1.0 3' > "$CONF"

check "chrony conf 1차 기록" 0 sts_write_chrony_conf_idempotent "$CONF"
assert_grep "UPDATED 표시" "CHRONY_CONF_UPDATED"
if sts_chrony_conf_is_slew_only "$CONF"; then
  echo "ok - slew-only 요건 충족"
else
  echo "not ok - slew-only 요건 미충족"
  cat "$CONF"
  fail=1
fi

# 기존 pool 줄은 유지되고 managed 블록이 추가되었는지
if grep -q 'pool 0.debian.pool.ntp.org' "$CONF" \
  && grep -q 'BEGIN MINDGARDEN_TIME_SYNC' "$CONF"; then
  echo "ok - 기존 줄 유지 + managed 블록 추가"
else
  echo "not ok - 기존/managed 혼재 상태 이상"
  cat "$CONF"
  fail=1
fi

# Ubuntu 기본 makestep 1.0 3 주석 처리 (managed 밖만)
check "unmanaged makestep 주석" 0 sts_comment_unmanaged_makestep "$CONF"
assert_grep "MAKESTEP_COMMENTED" "MAKESTEP_COMMENTED:"
if grep -qE '^[[:space:]]*#[[:space:]]*makestep[[:space:]]+1\.0[[:space:]]+3' "$CONF" \
  && grep -qE '^[[:space:]]*makestep[[:space:]]+-1[[:space:]]+-1' "$CONF" \
  && sts_chrony_no_active_step_makestep "$CONF"; then
  echo "ok - 활성 makestep 은 -1 -1 만"
else
  echo "not ok - makestep 주석/활성 상태 이상"
  cat "$CONF"
  fail=1
fi

# makestep 주석 멱등
BEFORE_MS=$(cksum "$CONF" | awk '{print $1" "$2}')
check "unmanaged makestep 2차" 0 sts_comment_unmanaged_makestep "$CONF"
assert_grep "MAKESTEP_UNCHANGED" "MAKESTEP_UNCHANGED:"
AFTER_MS=$(cksum "$CONF" | awk '{print $1" "$2}')
assert_eq "makestep 주석 2차 동일" "$BEFORE_MS" "$AFTER_MS"

# 2차 적용: 멱등 (UNCHANGED + 바이트 동일)
BEFORE_HASH=$(cksum "$CONF" | awk '{print $1" "$2}')
check "chrony conf 2차 기록" 0 sts_write_chrony_conf_idempotent "$CONF"
assert_grep "UNCHANGED" "CHRONY_CONF_UNCHANGED"
AFTER_HASH=$(cksum "$CONF" | awk '{print $1" "$2}')
assert_eq "2차 적용 후 내용 동일" "$BEFORE_HASH" "$AFTER_HASH"

# managed 블록이 하나만 있는지
BEGIN_COUNT=$(grep -c 'BEGIN MINDGARDEN_TIME_SYNC' "$CONF" || true)
assert_eq "BEGIN 마커 1개" "1" "$BEGIN_COUNT"

# 손상된 managed 블록 재작성
awk '
  /BEGIN MINDGARDEN_TIME_SYNC/ { print; print "server evil.example iburst"; next }
  /END MINDGARDEN_TIME_SYNC/ { print; next }
  { print }
' "$CONF" > "$CONF.broken"
# 위 awk는 불완전 — 직접 깨진 파일 작성
{
  echo '# existing'
  echo "$STS_MANAGED_BEGIN"
  echo 'server evil.example iburst'
  echo 'makestep 1.0 3'
  echo "$STS_MANAGED_END"
} > "$CONF"
check "깨진 managed 블록 재작성" 0 sts_write_chrony_conf_idempotent "$CONF"
if grep -q 'evil.example' "$CONF"; then
  echo "not ok - evil server 잔존"
  fail=1
else
  echo "ok - evil server 제거됨"
fi
if sts_chrony_conf_is_slew_only "$CONF"; then
  echo "ok - 재작성 후 slew-only"
else
  echo "not ok - 재작성 후 slew-only 실패"
  cat "$CONF"
  fail=1
fi

# drop-in 신규 파일
DROPIN="$FIXTURE/conf.d/99-mindgarden-time-sync.conf"
check "drop-in 신규 생성" 0 sts_write_chrony_conf_idempotent "$DROPIN"
if [ -f "$DROPIN" ] && sts_chrony_conf_is_slew_only "$DROPIN"; then
  echo "ok - drop-in 파일 생성"
else
  echo "not ok - drop-in 생성 실패"
  fail=1
fi

# Ubuntu 레이아웃: 메인 conf 에 makestep 1.0 3 + conf.d 드롭인 managed
UBUNTU_ROOT="$FIXTURE/ubuntu-like"
MAIN_CONF="$UBUNTU_ROOT/chrony/chrony.conf"
MAIN_ALT="$UBUNTU_ROOT/chrony.conf"
DROPIN_U="$UBUNTU_ROOT/chrony/conf.d/99-mindgarden-time-sync.conf"
mkdir -p "$(dirname "$MAIN_CONF")" "$(dirname "$DROPIN_U")"
cat > "$MAIN_CONF" <<'EOF'
# Welcome to the chrony configuration file. See chrony.conf(5) for more
# information about usable directives.
confdir /etc/chrony/conf.d
pool ntp.ubuntu.com        iburst maxsources 4
keyfile /etc/chrony/chrony.keys
driftfile /var/lib/chrony/chrony.drift
makestep 1.0 3
rtcsync
EOF
# 이미 주석된 makestep 도 유지되는지
printf '%s\n' '# makestep 0.1 1' >> "$MAIN_CONF"
# 존재하지 않는 alt 후보는 SKIP
rm -f "$MAIN_ALT"

check "ubuntu drop-in 기록" 0 sts_write_chrony_conf_idempotent "$DROPIN_U"
check "ubuntu mains makestep 주석" 0 \
  sts_comment_unmanaged_makestep_mains "$MAIN_CONF $MAIN_ALT"
assert_grep "메인 COMMENTED" "MAKESTEP_COMMENTED:$MAIN_CONF"
assert_grep "alt SKIP" "MAKESTEP_SKIP:$MAIN_ALT"

if grep -qE '^[[:space:]]*#[[:space:]]*makestep[[:space:]]+1\.0[[:space:]]+3' "$MAIN_CONF" \
  && grep -qE '^[[:space:]]*#[[:space:]]*makestep[[:space:]]+0\.1[[:space:]]+1' "$MAIN_CONF" \
  && ! grep -qE '^[[:space:]]*makestep[[:space:]]' "$MAIN_CONF" \
  && grep -qE '^[[:space:]]*makestep[[:space:]]+-1[[:space:]]+-1' "$DROPIN_U" \
  && sts_chrony_no_active_step_makestep "$MAIN_CONF" \
  && sts_chrony_no_active_step_makestep "$DROPIN_U" \
  && sts_chrony_conf_is_slew_only "$DROPIN_U"; then
  echo "ok - ubuntu-like: 메인 스텝 makestep 주석 + 드롭인 -1 -1 만 활성"
else
  echo "not ok - ubuntu-like makestep 상태"
  echo "--- MAIN ---"; cat "$MAIN_CONF"
  echo "--- DROPIN ---"; cat "$DROPIN_U"
  fail=1
fi

# mains 헬퍼 멱등
check "ubuntu mains 2차" 0 sts_comment_unmanaged_makestep_mains "$MAIN_CONF $MAIN_ALT"
assert_grep "메인 UNCHANGED" "MAKESTEP_UNCHANGED:$MAIN_CONF"

# --- grep ntp server lines ---
LINES=$(sts_grep_ntp_server_lines "$DROPIN_U")
if echo "$LINES" | grep -q 'time.bora.net'; then
  echo "ok - grep ntp server lines"
else
  echo "not ok - grep ntp server lines"
  echo "$LINES"
  fail=1
fi

# --- timesyncd idempotent ---
TSD="$FIXTURE/timesyncd.conf"
cat > "$TSD" <<'EOF'
[Time]
NTP=old.example
FallbackNTP=old2.example
EOF
check "timesyncd 1차" 0 sts_write_timesyncd_ntp_idempotent "$TSD"
assert_grep "timesyncd UPDATED" "TIMESYNCD_CONF_UPDATED"
if grep -q 'NTP=time.bora.net kr.pool.ntp.org' "$TSD" \
  && grep -q 'FallbackNTP=kr.pool.ntp.org' "$TSD"; then
  echo "ok - timesyncd NTP 값"
else
  echo "not ok - timesyncd NTP 값"
  cat "$TSD"
  fail=1
fi
BEFORE_T=$(cksum "$TSD" | awk '{print $1" "$2}')
check "timesyncd 2차 멱등" 0 sts_write_timesyncd_ntp_idempotent "$TSD"
AFTER_T=$(cksum "$TSD" | awk '{print $1" "$2}')
assert_eq "timesyncd 2차 동일" "$BEFORE_T" "$AFTER_T"

# --- entry script: unknown mode exit 2 (네트워크/root 불필요) ---
ENTRY="$DIR/server-time-sync.sh"
set +e
OUT=$(bash "$ENTRY" bogus 2>&1)
CODE=$?
set -e
if [ "$CODE" -eq 2 ]; then
  echo "ok - entry unknown mode exit 2"
else
  echo "not ok - entry unknown mode (exit $CODE)"
  printf '    %s\n' "$OUT"
  fail=1
fi

# diagnose with network skipped (still should exit 0 if tools missing is soft)
set +e
OUT=$(STS_SKIP_NETWORK=1 bash "$ENTRY" diagnose 2>&1)
CODE=$?
set -e
if [ "$CODE" -eq 0 ] && echo "$OUT" | grep -q 'DIAGNOSE_DONE'; then
  echo "ok - diagnose STS_SKIP_NETWORK exit 0"
else
  echo "not ok - diagnose STS_SKIP_NETWORK (exit $CODE)"
  printf '    %s\n' "${OUT//$'\n'/$'\n'    }"
  fail=1
fi

# shellcheck 있으면 참고 실행 (실패해도 테스트 전체 실패로 취급하지 않음 — 로컬 힌트)
if command -v shellcheck >/dev/null 2>&1; then
  if shellcheck -x "$DIR/server-time-sync-lib.sh" "$DIR/server-time-sync.sh" "$DIR/server-time-sync.test.sh" 2>&1; then
    echo "ok - shellcheck (available)"
  else
    echo "ok - shellcheck available but reported issues (non-blocking note)"
  fi
else
  echo "ok - shellcheck not installed (skipped; not required)"
fi

if [ "$fail" -eq 0 ]; then
  echo "ALL PASS"
  exit 0
fi
echo "SOME FAILED"
exit 1
