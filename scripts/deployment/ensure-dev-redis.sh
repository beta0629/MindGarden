#!/usr/bin/env bash
# Dev-only: idempotent redis-server install + bind 127.0.0.1 + requirepass.
# NEVER prints REDIS_PASSWORD (or any secret). Ping uses REDISCLI_AUTH only (no -a argv).
#
# Env (from GitHub Environment `dev` secrets via workflow):
#   REDIS_PASSWORD — required for install/config (empty → notice + exit 0)
#   REDIS_PORT     — listen port (default 6379); recommended secret value: 6379
#   REDIS_HOST     — informational; bind is always 127.0.0.1 (external bind forbidden)
#
# Exit: 0 on skip/success; non-zero only on hard install/config failure that should soft-warn upstream.
set +e
set -u

REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_HOST_HINT="${REDIS_HOST:-127.0.0.1}"
REDIS_PASSWORD="${REDIS_PASSWORD-}"
REDIS_CONF_CANDIDATES="/etc/redis/redis.conf /etc/redis.conf"
MG_DROPIN="/etc/redis/mindgarden-dev-local.conf"
UNIT_CANDIDATES="redis-server.service redis.service"

echo "=========================================="
echo "ensure-dev-redis (dev only, no secret values)"
echo "REDIS_HOST_hint_len=${#REDIS_HOST_HINT} REDIS_PORT=${REDIS_PORT}"
echo "REDIS_PASSWORD_len=${#REDIS_PASSWORD}"
echo "=========================================="

if [ -z "$REDIS_PASSWORD" ]; then
  echo "::notice title=Redis install skip::GitHub Secret REDIS_PASSWORD 가 비어 있어 Redis 설치·설정을 skip 합니다. BE 는 MEMORY_FALLBACK 으로 기동 가능합니다."
  exit 0
fi

# Prefer REDISCLI_AUTH so password is never on argv.
redis_ping() {
  local host="${1:-127.0.0.1}"
  local port="${2:-6379}"
  local out
  export REDISCLI_AUTH="${REDIS_PASSWORD}"
  out="$(redis-cli -h "$host" -p "$port" --no-auth-warning ping 2>/dev/null | tr -d '\r')"
  unset REDISCLI_AUTH
  printf '%s' "$out"
}

find_redis_conf() {
  # /etc/redis 는 종종 0750 root:redis — 일반 SSH 유저는 sudo test 필요
  local c
  for c in $REDIS_CONF_CANDIDATES; do
    if sudo test -f "$c" 2>/dev/null || test -f "$c"; then
      printf '%s' "$c"
      return 0
    fi
  done
  printf ''
}

find_redis_unit() {
  local u
  for u in $UNIT_CANDIDATES; do
    if systemctl list-unit-files "$u" >/dev/null 2>&1 \
      || systemctl status "$u" >/dev/null 2>&1 \
      || [ -f "/lib/systemd/system/$u" ] || [ -f "/etc/systemd/system/$u" ]; then
      printf '%s' "$u"
      return 0
    fi
  done
  # Default Debian/Ubuntu package unit name
  printf 'redis-server.service'
}

# --- 0) Fast path: already installed + ping PONG with current secret → skip ---
if command -v redis-server >/dev/null 2>&1 && command -v redis-cli >/dev/null 2>&1; then
  EARLY_PING="$(redis_ping 127.0.0.1 "$REDIS_PORT")"
  if [ "$EARLY_PING" = "PONG" ]; then
    echo "redis_cli_ping=PONG"
    echo "✅ redis-server 이미 기동·인증 OK — 설치·설정·restart skip (멱등)"
    exit 0
  fi
  echo "ℹ️ redis 설치됨이나 ping≠PONG (got_len=${#EARLY_PING}) — 설정 갱신 진행"
fi

# --- 1) Package install if missing ---
if ! command -v redis-server >/dev/null 2>&1; then
  echo "📦 redis-server 미설치 — apt 설치 진행"
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "::warning title=Redis install::apt-get 없음 — Ubuntu/Debian 외 OS 는 수동 설치 필요"
    exit 0
  fi
  sudo apt-get update -qq || {
    echo "::warning title=Redis install::apt-get update 실패 — skip"
    exit 0
  }
  if ! sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq redis-server; then
    echo "::warning title=Redis install::redis-server apt 설치 실패 — skip (배포는 계속)"
    exit 0
  fi
  echo "✅ redis-server 패키지 설치 완료"
else
  echo "✅ redis-server 이미 설치됨 — 패키지 설치 skip"
fi

REDIS_CONF="$(find_redis_conf)"
if [ -z "$REDIS_CONF" ]; then
  echo "::warning title=Redis conf missing::redis.conf 를 찾지 못함 — skip"
  exit 0
fi
echo "📄 redis.conf=${REDIS_CONF}"

# --- 2) Idempotent drop-in: bind 127.0.0.1 + requirepass (never cat contents) ---
sudo mkdir -p /etc/redis
# Write drop-in without printing secret (stdout discarded)
{
  printf '%s\n' '# Managed by scripts/deployment/ensure-dev-redis.sh (dev). Do not commit secrets.'
  printf '%s\n' 'bind 127.0.0.1'
  printf '%s\n' 'protected-mode yes'
  printf 'port %s\n' "$REDIS_PORT"
  # requirepass value from env — never echoed
  printf 'requirepass %s\n' "$REDIS_PASSWORD"
} | sudo tee "$MG_DROPIN" >/dev/null
sudo chmod 640 "$MG_DROPIN"
# Package user is usually redis
if getent passwd redis >/dev/null 2>&1; then
  sudo chown root:redis "$MG_DROPIN" 2>/dev/null || sudo chown root:root "$MG_DROPIN"
else
  sudo chown root:root "$MG_DROPIN"
fi
echo "✅ drop-in 작성: ${MG_DROPIN} (mode=$(sudo stat -c '%a' "$MG_DROPIN" 2>/dev/null || echo '?'), 내용 미출력)"

# Ensure main conf includes drop-in (last include wins for duplicate keys on Redis 6+)
INCLUDE_LINE="include ${MG_DROPIN}"
if ! sudo grep -qF "$INCLUDE_LINE" "$REDIS_CONF" 2>/dev/null; then
  printf '\n%s\n' "$INCLUDE_LINE" | sudo tee -a "$REDIS_CONF" >/dev/null
  echo "✅ ${REDIS_CONF} 에 include 추가"
else
  echo "✅ ${REDIS_CONF} include 이미 존재"
fi

# Harden main conf bind lines that may still expose 0.0.0.0 before include
# (comment-only change; drop-in still authoritative when included last)
if sudo grep -qE '^[[:space:]]*bind[[:space:]]+0\.0\.0\.0' "$REDIS_CONF" 2>/dev/null; then
  sudo sed -i -E 's/^[[:space:]]*bind[[:space:]]+0\.0\.0\.0.*/bind 127.0.0.1/' "$REDIS_CONF"
  echo "✅ main conf bind 0.0.0.0 → 127.0.0.1 보정"
fi

# supervised systemd (Debian packaging often sets this; ensure if commented)
if sudo grep -qE '^[[:space:]]*#?[[:space:]]*supervised[[:space:]]+' "$REDIS_CONF" 2>/dev/null; then
  sudo sed -i -E 's/^[[:space:]]*#?[[:space:]]*supervised[[:space:]]+.*/supervised systemd/' "$REDIS_CONF"
fi

UNIT="$(find_redis_unit)"
echo "🔧 systemd unit=${UNIT}"

# --- 3) enable + restart/reload ---
sudo systemctl daemon-reload || true
sudo systemctl enable "$UNIT" >/dev/null 2>&1 || true
if sudo systemctl is-active --quiet "$UNIT" 2>/dev/null; then
  echo "🔄 redis 이미 active — restart 로 설정 반영"
  sudo systemctl restart "$UNIT" || {
    echo "::warning title=Redis restart::${UNIT} restart 실패"
  }
else
  echo "🚀 redis 기동"
  sudo systemctl start "$UNIT" || {
    echo "::warning title=Redis start::${UNIT} start 실패"
  }
fi

# Brief settle
sleep 2
ACTIVE="$(sudo systemctl is-active "$UNIT" 2>/dev/null || echo unknown)"
echo "systemd_active=${ACTIVE}"

# --- 4) Ping (REDISCLI_AUTH; never print password) ---
if ! command -v redis-cli >/dev/null 2>&1; then
  echo "redis_cli_ping=NO_REDIS_CLI"
  echo "::warning title=Redis ping::redis-cli 없음"
  exit 0
fi

PING_OUT="$(redis_ping 127.0.0.1 "$REDIS_PORT")"
if [ "$PING_OUT" = "PONG" ]; then
  echo "redis_cli_ping=PONG"
  echo "✅ Redis 준비 완료 (bind=127.0.0.1 port=${REDIS_PORT})"
  exit 0
fi

echo "redis_cli_ping=FAIL"
echo "::warning title=Redis ping::시크릿·설치 후 ping 실패 (배포는 계속, BE MEMORY_FALLBACK 가능). systemd=${ACTIVE}"
sudo systemctl status "$UNIT" --no-pager -l 2>/dev/null | head -n 20 || true
exit 0
