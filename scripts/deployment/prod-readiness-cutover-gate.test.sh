#!/bin/bash
# 풀 워밍 성공 전에는 upstream 이 그대로이고, 성공 후에만 바뀌며, restart 는 0이다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")" && pwd)
LIB="$ROOT/prod-readiness-cutover-gate.sh"
# shellcheck disable=SC1091
. "$LIB"

if grep -nE '^[^#]*systemctl[[:space:]]+restart([[:space:]]|$)' "$LIB"; then
  echo "FAIL: 게이트 스크립트에 systemctl restart 가 있다" >&2
  exit 1
fi

if [ "$PROD_GATE_MAX_ATTEMPTS" -ne 10 ] || [ "$PROD_GATE_SLEEP_SECONDS" -ne 6 ]; then
  echo "FAIL: 재시도가 헬스 패턴(10회, 6초)과 다르다" >&2
  exit 1
fi

if awk -v t="$PROD_GATE_FAST_SECONDS" 'BEGIN { exit (t+0 < 30 && t+0 > 0) ? 0 : 1 }'; then
  :
else
  echo "FAIL: 빠른 응답 기준이 connection-timeout 30초를 넘거나 비어 있다" >&2
  exit 1
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
export PROD_GATE_SUDO=none

SLEEP_CALLS=0
prod_gate_sleep() {
  SLEEP_CALLS=$((SLEEP_CALLS + 1))
}

RESTART_LOG="$WORKDIR/systemctl.log"
: > "$RESTART_LOG"
systemctl() {
  printf '%s\n' "$*" >> "$RESTART_LOG"
}
nginx() {
  if [ "${1:-}" = "-t" ]; then
    return 0
  fi
  echo "unexpected nginx $*" >> "$RESTART_LOG"
  return 1
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_restart_zero() {
  if [ -s "$RESTART_LOG" ] && grep -q 'restart' "$RESTART_LOG"; then
    fail "restart 가 호출됨: $(cat "$RESTART_LOG")"
  fi
}

CURL_SCRIPT=""
curl() {
  # shellcheck disable=SC1090
  . "$CURL_SCRIPT"
}

prepare_upstream() {
  local dest="$1"
  local port="$2"
  mkdir -p "$(dirname "$dest")"
  prod_upstream_conf "127.0.0.1" "$port" > "$dest"
}

echo "=== 실패: 10회 모두 503 이면 upstream 유지, restart 0 ==="
DEST="$WORKDIR/fail/upstream.conf"
prepare_upstream "$DEST" 8080
BEFORE=$(cat "$DEST")
CURL_COUNT="$WORKDIR/curl-fail.count"
: > "$CURL_COUNT"
CURL_SCRIPT="$WORKDIR/curl-fail.sh"
cat > "$CURL_SCRIPT" <<EOF
printf 'x\\n' >> "$CURL_COUNT"
if grep -q '8081' "\$DEST"; then
  echo "early-write" > "$WORKDIR/early"
fi
printf '%s' '503 0.2'
EOF
# curl 은 \$(...) 서브셸이라 카운트는 파일에 남긴다.
if prod_apply_readiness_gate "http://127.0.0.1:9/api/v1/health/readiness" "$DEST" "127.0.0.1" 8081; then
  fail "실패 응답인데 게이트가 성공했다"
fi
AFTER=$(cat "$DEST")
[ "$BEFORE" = "$AFTER" ] || fail "실패 중에 upstream 이 바뀌었다"
CURL_N=$(wc -l < "$CURL_COUNT" | tr -d '[:space:]')
[ "$CURL_N" -eq 10 ] || fail "재시도가 10회가 아니다: $CURL_N"
[ ! -f "$WORKDIR/early" ] || fail "성공 전에 upstream 이 바뀌었다"
assert_restart_zero
[ "$SLEEP_CALLS" -eq 9 ] || fail "대기가 헬스 간격과 다르다: $SLEEP_CALLS"

echo "=== 느린 200 은 성공이 아니고 upstream 유지 ==="
DEST="$WORKDIR/slow/upstream.conf"
prepare_upstream "$DEST" 8080
BEFORE=$(cat "$DEST")
CURL_SCRIPT="$WORKDIR/curl-slow.sh"
cat > "$CURL_SCRIPT" <<'EOF'
printf '%s' '200 25.0'
EOF
if prod_apply_readiness_gate "http://127.0.0.1:9/api/v1/health/readiness" "$DEST" "127.0.0.1" 8081; then
  fail "25초 응답을 통과로 봤다"
fi
[ "$(cat "$DEST")" = "$BEFORE" ] || fail "느린 200 에 upstream 이 바뀌었다"
assert_restart_zero

echo "=== 앞선 시도가 실패한 동안에는 파일이 그대로, 빠른 200 이후에만 변경 ==="
DEST="$WORKDIR/ok/upstream.conf"
prepare_upstream "$DEST" 8080
CURL_COUNT="$WORKDIR/curl-ok.count"
: > "$CURL_COUNT"
CURL_SCRIPT="$WORKDIR/curl-ok.sh"
cat > "$CURL_SCRIPT" <<EOF
printf 'x\\n' >> "$CURL_COUNT"
n=\$(wc -l < "$CURL_COUNT" | tr -d '[:space:]')
if grep -q 'server 127.0.0.1:8081;' "\$DEST"; then
  echo "early-write" > "$WORKDIR/early-ok"
fi
if [ "\$n" -lt 3 ]; then
  printf '%s' '503 0.1'
else
  printf '%s' '200 0.04'
fi
EOF
prod_apply_readiness_gate "http://127.0.0.1:9/api/v1/health/readiness" "$DEST" "127.0.0.1" 8081
grep -q 'server 127.0.0.1:8081;' "$DEST" || fail "성공 후 upstream 이 새 포트가 아니다"
CURL_N=$(wc -l < "$CURL_COUNT" | tr -d '[:space:]')
[ "$CURL_N" -eq 3 ] || fail "성공 시도 횟수가 아니다: $CURL_N"
[ ! -f "$WORKDIR/early-ok" ] || fail "빠른 200 이전에 upstream 이 바뀌었다"
assert_restart_zero
if grep -q 'restart' "$RESTART_LOG"; then
  fail "restart 기록: $(cat "$RESTART_LOG")"
fi

echo "=== 정적 번들 미완이면 reload 없이 upstream 을 되돌린다 ==="
FE="$WORKDIR/fe-bad"
mkdir -p "$FE"
printf '%s\n' '<script src="/static/js/main.abc123.js"></script>' > "$FE/index.html"
SNIP="$WORKDIR/nginx/upstream.conf"
BACKUP="$WORKDIR/nginx/upstream.bak"
prepare_upstream "$BACKUP" 8080
prepare_upstream "$SNIP" 8081
export PROD_FRONTEND_ROOT="$FE"
export UPSTREAM_SNIP="$SNIP"
export UPSTREAM_BACKUP="$BACKUP"
export UPSTREAM_CHANGED=1
export PROD_VHOST_SRC="$WORKDIR/nginx/vhost.conf"
export PROD_VHOST_DEST="$WORKDIR/nginx/sites/core-solution"
export PROD_VHOST_LINK="$WORKDIR/nginx/enabled/core-solution"
export PROD_PROXY_SRC="$WORKDIR/nginx/proxy.conf"
export PROD_PROXY_DEST="$WORKDIR/nginx/snippets/proxy.conf"
printf '%s\n' 'server { listen 80; }' > "$PROD_VHOST_SRC"
printf '%s\n' 'proxy_read_timeout 60s;' > "$PROD_PROXY_SRC"
export ACTIVE_FILE="$WORKDIR/nginx/active-backend"
export INACTIVE=green
export INACTIVE_PORT=8081
export MG_BACKEND_BIND_HOST=127.0.0.1
export MG_BLUE_PORT=8080
: > "$RESTART_LOG"
if prod_nginx_switch_preserving_connections; then
  fail "미완 번들인데 nginx 전환이 성공했다"
fi
grep -q 'server 127.0.0.1:8080;' "$SNIP" || fail "미완 번들 뒤에 upstream 이 되돌아가지 않았다"
if grep -q '8081' "$SNIP"; then
  fail "미완 번들인데 새 포트가 남았다"
fi
[ ! -s "$RESTART_LOG" ] || fail "미완 번들에서 systemctl/nginx 가 호출됨: $(cat "$RESTART_LOG")"
assert_restart_zero

echo "=== 번들이 완전하고 설정이 같으면 reload 하지 않는다 ==="
FE="$WORKDIR/fe-ok"
mkdir -p "$FE/static/js" "$FE/static/css"
printf '%s\n' 'console.log(1);' > "$FE/static/js/main.abc123.js"
printf '%s\n' 'body{}' > "$FE/static/css/main.abc123.css"
cat > "$FE/index.html" <<'EOF'
<link href="/static/css/main.abc123.css" rel="stylesheet">
<script src="/static/js/main.abc123.js"></script>
EOF
export PROD_FRONTEND_ROOT="$FE"
export UPSTREAM_CHANGED=0
SAME="$WORKDIR/same"
mkdir -p "$SAME/sites" "$SAME/enabled" "$SAME/snippets"
printf '%s\n' 'server { listen 80; }' > "$SAME/vhost.conf"
cp "$SAME/vhost.conf" "$SAME/sites/core-solution"
printf '%s\n' 'proxy_read_timeout 60s;' > "$SAME/proxy.conf"
cp "$SAME/proxy.conf" "$SAME/snippets/proxy.conf"
prepare_upstream "$SAME/upstream.conf" 8080
export UPSTREAM_SNIP="$SAME/upstream.conf"
export UPSTREAM_BACKUP=""
export PROD_VHOST_SRC="$SAME/vhost.conf"
export PROD_VHOST_DEST="$SAME/sites/core-solution"
export PROD_VHOST_LINK="$SAME/enabled/core-solution"
export PROD_PROXY_SRC="$SAME/proxy.conf"
export PROD_PROXY_DEST="$SAME/snippets/proxy.conf"
: > "$RESTART_LOG"
prod_nginx_switch_preserving_connections
grep -q 'server 127.0.0.1:8080;' "$UPSTREAM_SNIP" || fail "동일 설정에서 upstream 이 바뀌었다"
[ ! -s "$RESTART_LOG" ] || fail "동일 설정에서 reload 가 호출됨: $(cat "$RESTART_LOG")"
assert_restart_zero

echo "=== 번들이 완전하고 upstream 이 바뀌었으면 reload 만, restart 는 0 ==="
export UPSTREAM_CHANGED=1
export UPSTREAM_BACKUP="$BACKUP"
prepare_upstream "$SNIP" 8081
export UPSTREAM_SNIP="$SNIP"
export ACTIVE_FILE="$WORKDIR/nginx/active-backend"
: > "$RESTART_LOG"
prod_nginx_switch_preserving_connections
grep -q 'reload nginx' "$RESTART_LOG" || fail "성공 전환에서 reload 가 없다: $(cat "$RESTART_LOG")"
if grep -q 'restart' "$RESTART_LOG"; then
  fail "성공 전환에서 restart 가 있다: $(cat "$RESTART_LOG")"
fi
grep -q 'server 127.0.0.1:8081;' "$SNIP" || fail "성공 전환 후 새 포트가 없다"
[ "$(tr -d '[:space:]' < "$ACTIVE_FILE")" = "green" ] || fail "active-backend 가 green 이 아니다"
assert_restart_zero

echo "OK: warmup 전 upstream 유지, 성공 후 변경, restart 0, 미완 번들은 reload 없음"
