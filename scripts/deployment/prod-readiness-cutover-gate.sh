#!/bin/bash
# 운영 블루그린 전환 게이트.
# - 풀 워밍(/api/v1/health/readiness)이 빠르게 200일 때만 upstream 파일을 쓴다.
# - 느리거나 실패하면 파일을 그대로 둔다. 슬롯을 다시 띄우는 명령은 없다.
# - 대기 횟수는 actuator/health 와 같은 10회·간격 6초를 넘지 않는다.
# - nginx reload(SIGHUP)는 워커를 갈아 진행 중인 HTTP/2 스트림을 끊는다.
#   브라우저는 로그인 main.*.js 를 net::ERR_HTTP2_PROTOCOL_ERROR 로 본다.
#   설정이 같으면 reload 하지 않아 이미 열린 연결을 유지한다.
#   reload 가 필요할 때는 그 전에 index.html 이 가리키는 main 번들이 완전한지 확인한다.
# 이 파일은 source 해서 쓴다. Hikari 풀 크기·connection-timeout·nginx /api/ 60초는 바꾸지 않는다.

# actuator/health 재시도(deploy-production.yml, 1..10 · sleep 6)와 같다. 더 많이 돌리지 않는다.
PROD_GATE_MAX_ATTEMPTS=10
PROD_GATE_SLEEP_SECONDS=6
# 이 초를 넘긴 200 은 준비가 아니다. 프로브 예산(5초)보다 조금 넓고, Hikari connection-timeout 30초보다 짧다.
PROD_GATE_FAST_SECONDS=6
# curl 이 30초 대기를 성공으로 착각하지 않게 상한을 둔다.
PROD_GATE_CURL_MAX_TIME=8
PROD_GATE_CONNECT_TIMEOUT=5

prod_gate_sleep() {
  sleep "$1"
}

prod_gate_as_root() {
  if [ "${PROD_GATE_SUDO:-sudo}" = "none" ]; then
    "$@"
  else
    # shellcheck disable=SC2086
    ${PROD_GATE_SUDO:-sudo} "$@"
  fi
}

prod_gate_write_text() {
  local dest="$1"
  local dir
  dir=$(dirname "$dest")
  prod_gate_as_root mkdir -p "$dir"
  if [ "${PROD_GATE_SUDO:-sudo}" = "none" ]; then
    cat > "$dest"
  else
    ${PROD_GATE_SUDO:-sudo} tee "$dest" >/dev/null
  fi
}

prod_upstream_conf() {
  local host="$1"
  local port="$2"
  printf '%s\n' \
    '# CF520: single active + keepalive; do not dual-server live BG' \
    'upstream mindgarden_core_backend {' \
    "    server ${host}:${port};" \
    '    keepalive 32;' \
    '}'
}

prod_time_is_fast() {
  local elapsed="$1"
  local limit="$2"
  if [ -z "$elapsed" ] || [ -z "$limit" ]; then
    return 1
  fi
  awk -v t="$elapsed" -v max="$limit" 'BEGIN { if ((t + 0) <= (max + 0)) exit 0; exit 1 }'
}

# stdout 없음. 0 이면 이번 시도가 빠르고 HTTP 200.
prod_readiness_is_fast() {
  local url="$1"
  local body meta code elapsed err
  body=$(mktemp)
  err=$(mktemp)
  meta=$(curl -sS -o "$body" -w '%{http_code} %{time_total}' \
    --connect-timeout "$PROD_GATE_CONNECT_TIMEOUT" \
    --max-time "$PROD_GATE_CURL_MAX_TIME" \
    "$url" 2>"$err") || true
  code=$(printf '%s' "$meta" | awk '{print $1}')
  elapsed=$(printf '%s' "$meta" | awk '{print $2}')
  echo "레디니스 HTTP ${code:-000} time=${elapsed:-?}s"
  head -c 400 "$body" 2>/dev/null || true
  echo ""
  if [ -s "$err" ]; then
    head -c 200 "$err" || true
    echo ""
  fi
  rm -f "$body" "$err"
  if [ "$code" != "200" ]; then
    return 1
  fi
  prod_time_is_fast "$elapsed" "$PROD_GATE_FAST_SECONDS"
}

# 성공 시에만 dest 를 덮어쓴다. 재시작 명령은 없다.
prod_apply_readiness_gate() {
  local url="$1"
  local dest="$2"
  local host="$3"
  local port="$4"
  local attempt=1
  echo "🏥 비활성 슬롯 풀 워밍 레디니스 (minimum-idle SELECT 1 + Redis, ${url})"
  while [ "$attempt" -le "$PROD_GATE_MAX_ATTEMPTS" ]; do
    if prod_readiness_is_fast "$url"; then
      prod_upstream_conf "$host" "$port" | prod_gate_write_text "$dest"
      echo "✅ 풀 워밍 통과 (시도 ${attempt}/${PROD_GATE_MAX_ATTEMPTS}) — upstream 파일만 기록. 슬롯 재시작 없음."
      return 0
    fi
    echo "⏳ 풀 워밍 대기... (${attempt}/${PROD_GATE_MAX_ATTEMPTS}) — upstream 유지, 재시작 없음"
    if [ "$attempt" -ge "$PROD_GATE_MAX_ATTEMPTS" ]; then
      break
    fi
    prod_gate_sleep "$PROD_GATE_SLEEP_SECONDS"
    attempt=$((attempt + 1))
  done
  echo "::error::풀 워밍 레디니스 실패 — nginx upstream 유지. 슬롯 추가 재시작 안 함."
  return 1
}

prod_static_bundle_complete() {
  local root="$1"
  local index="$root/index.html"
  local refs ref path size_before size_after bytes
  if [ ! -f "$index" ]; then
    echo "::error::index.html 없음: $index"
    return 1
  fi
  refs=$(grep -oE '/static/(js|css)/main\.[A-Za-z0-9]+\.(js|css)' "$index" | sort -u || true)
  if ! printf '%s\n' "$refs" | grep -qE '/static/js/main\.[A-Za-z0-9]+\.js'; then
    echo "::error::index.html 이 main.*.js 를 가리키지 않음"
    return 1
  fi
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    path="${root}${ref}"
    if [ ! -f "$path" ]; then
      echo "::error::정적 파일 없음: $path"
      return 1
    fi
    size_before=$(stat -c '%s' "$path" 2>/dev/null || echo 0)
    bytes=$(wc -c < "$path" | tr -d '[:space:]')
    size_after=$(stat -c '%s' "$path" 2>/dev/null || echo 0)
    if [ "$size_before" -le 0 ] || [ "$bytes" != "$size_before" ] || [ "$size_after" != "$size_before" ]; then
      echo "::error::정적 파일이 완전하지 않음: $path size=${size_before} read=${bytes}"
      return 1
    fi
  done <<EOF
$refs
EOF
  echo "✅ 로그인 정적 번들 완전 (main.*.js 크기 확인)"
  return 0
}

prod_files_identical() {
  [ -f "$1" ] && [ -f "$2" ] && prod_gate_as_root cmp -s "$1" "$2"
}

prod_restore_upstream() {
  if [ "${UPSTREAM_CHANGED:-0}" != "1" ]; then
    return 0
  fi
  if [ -n "${UPSTREAM_BACKUP:-}" ] && [ -s "$UPSTREAM_BACKUP" ]; then
    prod_gate_as_root cp "$UPSTREAM_BACKUP" "$UPSTREAM_SNIP"
    echo "upstream 스니펫을 전환 전으로 되돌림 — 기존 슬롯이 계속 받는다"
  fi
}

# 정적 번들이 완전하고, 설정이 바뀐 경우에만 reload 한다.
# 전제: UPSTREAM_SNIP, UPSTREAM_CHANGED, UPSTREAM_BACKUP, ACTIVE_FILE,
#       INACTIVE, INACTIVE_PORT, MG_BACKEND_BIND_HOST, MG_BLUE_PORT
prod_nginx_switch_preserving_connections() {
  local frontend vhost_src vhost_dest vhost_link proxy_src proxy_dest
  local need_reload=0
  local vhost_snapshot=""
  frontend="${PROD_FRONTEND_ROOT:-/var/www/mindgarden/frontend}"
  vhost_src="${PROD_VHOST_SRC:-/var/www/mindgarden/core-solution-prod.conf}"
  vhost_dest="${PROD_VHOST_DEST:-/etc/nginx/sites-available/core-solution}"
  vhost_link="${PROD_VHOST_LINK:-/etc/nginx/sites-enabled/core-solution}"
  proxy_src="${PROD_PROXY_SRC:-/var/www/mindgarden/mindgarden-core-proxy-params.conf}"
  proxy_dest="${PROD_PROXY_DEST:-/etc/nginx/snippets/mindgarden-core-proxy-params.conf}"

  if ! prod_static_bundle_complete "$frontend"; then
    echo "::error::정적 번들 미완 — nginx reload 안 함. 열려 있는 HTTP/2 연결을 유지한다."
    prod_restore_upstream
    return 1
  fi

  if [ "${UPSTREAM_CHANGED:-0}" = "1" ]; then
    need_reload=1
  fi
  if [ ! -f "$UPSTREAM_SNIP" ]; then
    need_reload=1
  fi
  if [ -f "$vhost_src" ] && ! prod_files_identical "$vhost_src" "$vhost_dest"; then
    need_reload=1
  fi
  if [ -f "$proxy_src" ] && ! prod_files_identical "$proxy_src" "$proxy_dest"; then
    need_reload=1
  fi

  prod_gate_as_root mkdir -p "$(dirname "$proxy_dest")"
  prod_gate_as_root mkdir -p "$(dirname "$UPSTREAM_SNIP")"
  prod_gate_as_root mkdir -p "$(dirname "$vhost_dest")"
  prod_gate_as_root mkdir -p "$(dirname "$vhost_link")"
  if [ -f "$proxy_src" ]; then
    prod_gate_as_root cp "$proxy_src" "$proxy_dest"
    echo "✅ Core proxy-params → $proxy_dest"
  else
    echo "::warning::mindgarden-core-proxy-params.conf 업로드 없음 — vhost include 실패 가능(CF520 스니펫)"
  fi
  if [ ! -f "$UPSTREAM_SNIP" ]; then
    echo "::warning::upstream 스니펫 없음 — 기본 ${MG_BLUE_PORT} 생성(최초 서버 또는 마이그레이션)"
    prod_upstream_conf "$MG_BACKEND_BIND_HOST" "$MG_BLUE_PORT" | prod_gate_write_text "$UPSTREAM_SNIP"
    need_reload=1
  fi
  if [ -f "$vhost_dest" ]; then
    vhost_snapshot=$(mktemp)
    prod_gate_as_root cp "$vhost_dest" "$vhost_snapshot"
  fi
  prod_gate_as_root cp "$vhost_src" "$vhost_dest"
  prod_gate_as_root ln -sfn "$vhost_dest" "$vhost_link"

  if [ "$need_reload" != "1" ]; then
    echo "nginx 설정 변경 없음 — reload 생략. 열려 있는 HTTP/2 연결 유지."
    rm -f "$vhost_snapshot"
    return 0
  fi

  echo "로그인 정적 번들 확인 완료 — 바뀐 nginx 설정만 reload (방화벽 미변경)"
  if ! prod_gate_as_root nginx -t; then
    echo "::error::nginx -t 실패 — reload 안 함. upstream 유지."
    if [ -n "$vhost_snapshot" ] && [ -s "$vhost_snapshot" ]; then
      prod_gate_as_root cp "$vhost_snapshot" "$vhost_dest"
    fi
    rm -f "$vhost_snapshot"
    prod_restore_upstream
    return 1
  fi
  prod_gate_as_root systemctl reload nginx
  echo "✅ Nginx reload 완료"
  rm -f "$vhost_snapshot"
  if [ "${UPSTREAM_CHANGED:-0}" = "1" ]; then
    printf '%s\n' "$INACTIVE" | prod_gate_write_text "$ACTIVE_FILE"
    echo "✅ active-backend → ${INACTIVE} (트래픽은 이제 포트 ${INACTIVE_PORT})"
  fi
  return 0
}
