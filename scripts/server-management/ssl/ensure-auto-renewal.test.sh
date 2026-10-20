#!/usr/bin/env bash
# ensure-auto-renewal-lib.sh 자가 테스트 (root/certbot/네트워크 불필요)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=ensure-auto-renewal-lib.sh
. "$DIR/ensure-auto-renewal-lib.sh"

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

FIXTURE="$(mktemp -d)"
cleanup() { rm -rf "$FIXTURE"; }
trap cleanup EXIT

RENEWAL="$FIXTURE/renewal"
HOOK_DIR="$FIXTURE/hooks/deploy"
WEBROOT="$FIXTURE/www"
mkdir -p "$RENEWAL" "$HOOK_DIR" "$WEBROOT"

# --- fixture renewal confs ---
cat > "$RENEWAL/dev.core-solution.co.kr.conf" <<'EOF'
version = 2.9.0
archive_dir = /etc/letsencrypt/archive/dev.core-solution.co.kr
cert = /etc/letsencrypt/live/dev.core-solution.co.kr/cert.pem
privkey = /etc/letsencrypt/live/dev.core-solution.co.kr/privkey.pem
chain = /etc/letsencrypt/live/dev.core-solution.co.kr/chain.pem
fullchain = /etc/letsencrypt/live/dev.core-solution.co.kr/fullchain.pem

[renewalparams]
account = testaccount
authenticator = standalone
server = https://acme-v02.api.letsencrypt.org/directory
EOF

cat > "$RENEWAL/dev.e-trinity.co.kr.conf" <<'EOF'
version = 2.9.0

[renewalparams]
account = testaccount
authenticator = standalone
server = https://acme-v02.api.letsencrypt.org/directory
EOF

cat > "$RENEWAL/mindgarden.dev.core-solution.co.kr.conf" <<'EOF'
version = 2.9.0

[renewalparams]
account = testaccount
authenticator = nginx
server = https://acme-v02.api.letsencrypt.org/directory
EOF

cat > "$RENEWAL/already-webroot.example.conf" <<'EOF'
version = 2.9.0

[renewalparams]
account = testaccount
authenticator = webroot
webroot_path = /var/www/html,
server = https://acme-v02.api.letsencrypt.org/directory

[[webroot_map]]
already-webroot.example = /var/www/html
EOF

# --- mindgarden lineage report ---
check "mindgarden lineage 문구 출력" 0 ssl_report_mindgarden_lineage "$RENEWAL"
assert_grep "MINDGARDEN_LINEAGE 포함" "MINDGARDEN_LINEAGE: mindgarden.dev.core-solution.co.kr"
assert_grep "전환 대상 아님 명시" "전환 대상 아님"

# --- DEV convert standalone → webroot ---
check "DEV 모드 standalone→webroot 전환" 0 \
  ssl_convert_standalone_renewals "dev" "$RENEWAL" "$WEBROOT"
assert_grep "dev.core-solution 전환" "CONVERTED: dev.core-solution.co.kr"
assert_grep "dev.e-trinity 전환" "CONVERTED: dev.e-trinity.co.kr"
assert_grep "mindgarden 스킵 문구" "MINDGARDEN_LINEAGE: mindgarden.dev.core-solution.co.kr"

AUTH_DEV=$(ssl_renewal_authenticator "$RENEWAL/dev.core-solution.co.kr.conf")
AUTH_ET=$(ssl_renewal_authenticator "$RENEWAL/dev.e-trinity.co.kr.conf")
AUTH_MG=$(ssl_renewal_authenticator "$RENEWAL/mindgarden.dev.core-solution.co.kr.conf")
if [ "$AUTH_DEV" = "webroot" ] && [ "$AUTH_ET" = "webroot" ] && [ "$AUTH_MG" = "nginx" ]; then
  echo "ok - DEV 전환 후 authenticator 값"
else
  echo "not ok - DEV 전환 후 authenticator (dev=$AUTH_DEV et=$AUTH_ET mg=$AUTH_MG)"
  fail=1
fi

if [ -f "$RENEWAL/dev.core-solution.co.kr.conf.bak" ]; then
  echo "ok - .bak 백업 생성"
else
  echo "not ok - .bak 백업 없음"
  fail=1
fi

if grep -q "webroot_path = ${WEBROOT}," "$RENEWAL/dev.core-solution.co.kr.conf" \
  && grep -q "\[\[webroot_map\]\]" "$RENEWAL/dev.core-solution.co.kr.conf" \
  && grep -q "dev.core-solution.co.kr = ${WEBROOT}" "$RENEWAL/dev.core-solution.co.kr.conf"; then
  echo "ok - webroot_path 및 webroot_map 반영"
else
  echo "not ok - webroot conf 내용 불완전"
  cat "$RENEWAL/dev.core-solution.co.kr.conf"
  fail=1
fi

# mindgarden 은 패치 함수에서도 SKIP
RESULT=$(ssl_patch_standalone_to_webroot "$RENEWAL/mindgarden.dev.core-solution.co.kr.conf" "$WEBROOT")
if [ "$RESULT" = "SKIP" ]; then
  echo "ok - mindgarden patch SKIP"
else
  echo "not ok - mindgarden patch expected SKIP got $RESULT"
  fail=1
fi

# --- PROD: standalone 변경 금지 ---
PROD_DIR="$FIXTURE/prod-renewal"
mkdir -p "$PROD_DIR"
cat > "$PROD_DIR/app.example.conf" <<'EOF'
[renewalparams]
authenticator = standalone
EOF
check "PROD 모드 standalone 미변경" 0 \
  ssl_convert_standalone_renewals "prod" "$PROD_DIR" "$WEBROOT"
assert_grep "PROD WARN" "WARN: PROD standalone 유지"
AUTH_PROD=$(ssl_renewal_authenticator "$PROD_DIR/app.example.conf")
if [ "$AUTH_PROD" = "standalone" ]; then
  echo "ok - PROD authenticator 그대로 standalone"
else
  echo "not ok - PROD 가 변경됨: $AUTH_PROD"
  fail=1
fi

# --- dry-run 판정 ---
LOG_OK="$FIXTURE/ok.log"
LOG_FAIL="$FIXTURE/fail.log"
LOG_RATE="$FIXTURE/rate.log"
printf 'Congratulations, all simulated renewals succeeded\n' > "$LOG_OK"
printf 'The following simulated renewals failed:\n  /etc/letsencrypt/live/dev.core-solution.co.kr\n' > "$LOG_FAIL"
printf 'An unexpected error occurred:\nrateLimited :: too many requests\n' > "$LOG_RATE"

check "all-success exit 0" 0 ssl_evaluate_dryrun_result 0 "$LOG_OK"
assert_grep "SUCCESS 판정" "^SUCCESS$"

check "partial-fail exit 1" 1 ssl_evaluate_dryrun_result 1 "$LOG_FAIL"
assert_grep "FAIL 판정" "^FAIL$"

# exit 0 이어도 fail 문구면 FAIL
check "exit0+fail문구는 FAIL" 1 ssl_evaluate_dryrun_result 0 "$LOG_FAIL"
assert_grep "exit0 FAIL 문구" "^FAIL$"

check "rate-limit exit 1" 1 ssl_evaluate_dryrun_result 1 "$LOG_RATE"
assert_grep "RATE_LIMITED 판정" "^RATE_LIMITED$"

# 문자열 직접 전달
check "rate limit 문자열 감지" 1 \
  ssl_evaluate_dryrun_result 0 "Error: rate limit exceeded for host"
assert_grep "문자열 RATE_LIMITED" "^RATE_LIMITED$"

# --- deploy hook 설치 ---
HOOK_DEST="$HOOK_DIR/01-reload-nginx.sh"
check "hook 설치" 0 ssl_install_nginx_reload_hook "$HOOK_DEST" "$DIR/01-reload-nginx.sh"
assert_grep "HOOK_INSTALLED" "HOOK_INSTALLED:"
if [ -x "$HOOK_DEST" ] && grep -q 'systemctl reload nginx' "$HOOK_DEST"; then
  echo "ok - hook 실행권한 및 reload 내용"
else
  echo "not ok - hook 내용/권한"
  fail=1
fi

# heredoc fallback
HOOK2="$HOOK_DIR/01-reload-nginx-heredoc.sh"
check "hook heredoc 설치" 0 ssl_install_nginx_reload_hook "$HOOK2"
if grep -q 'systemctl reload nginx' "$HOOK2"; then
  echo "ok - heredoc hook body"
else
  echo "not ok - heredoc hook body"
  fail=1
fi

# --- pipefail: mock certbot 실패가 tee 성공으로 가려지지 않음 ---
MOCK_BIN="$FIXTURE/mock-certbot-fail"
cat > "$MOCK_BIN" <<'EOF'
#!/usr/bin/env bash
echo "simulated renewals failed" >&2
exit 1
EOF
chmod +x "$MOCK_BIN"
MOCK_LOG="$FIXTURE/mock-dryrun.log"
set +e
SSL_CERTBOT_BIN="$MOCK_BIN" ssl_run_certbot_renew_dryrun "$MOCK_LOG" >/dev/null
MOCK_EXIT=$?
set -e
if [ "$MOCK_EXIT" -ne 0 ]; then
  echo "ok - pipefail: certbot 실패 exit 전달"
else
  echo "not ok - pipefail: certbot 실패가 0으로 가려짐"
  fail=1
fi
VERDICT=$(ssl_evaluate_dryrun_result "$MOCK_EXIT" "$MOCK_LOG" || true)
if [ "$VERDICT" = "FAIL" ]; then
  echo "ok - mock dry-run FAIL 판정"
else
  echo "not ok - mock dry-run 판정=$VERDICT"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "ALL PASS"
  exit 0
fi
echo "SOME FAILED"
exit 1
