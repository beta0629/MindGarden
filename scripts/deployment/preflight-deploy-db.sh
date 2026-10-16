#!/usr/bin/env bash
# 블루그린 트래픽 전환 전 DB preflight.
# load-deploy-db-env.sh 로 DB_* 로드 → DB_PASSWORD 존재 → SELECT 1.
# 실패 시 exit 1 (전환 전 중단). 비밀번호 값 echo 금지.
#
# 호출 전(선택): MG_DEPLOY_ENV_FILE, MG_DEPLOY_SYSTEMD_UNITS,
#   MG_DEPLOY_DB_PASSWORD_FALLBACK / PRODUCTION_DB_PASSWORD / DEV_DB_PASSWORD
#
# 환경:
#   MYSQL_DEPLOY_MYSQL_BIN / FLYWAY_HEALTH_MYSQL_BIN — mysql 바이너리 (테스트 mock)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOAD_DB="${SCRIPT_DIR}/load-deploy-db-env.sh"
MYSQL_CLIENT="${SCRIPT_DIR}/mysql-deploy-client.sh"

if [ ! -f "$LOAD_DB" ]; then
  echo "❌ preflight-deploy-db: load-deploy-db-env.sh 없음 ($LOAD_DB)" >&2
  exit 1
fi
if [ ! -f "$MYSQL_CLIENT" ]; then
  echo "❌ preflight-deploy-db: mysql-deploy-client.sh 없음 ($MYSQL_CLIENT)" >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$LOAD_DB"
# shellcheck disable=SC1090
. "$MYSQL_CLIENT"

echo "🔍 preflight-deploy-db: SELECT 1 (host=${DB_HOST:-"(empty)"} user=${DB_USERNAME:-"(empty)"} db=${DB_NAME:-"(empty)"})"

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "❌ preflight-deploy-db: DB_PASSWORD 없음 — 트래픽 전환 전 중단" >&2
  exit 1
fi
if [ -z "${DB_HOST:-}" ] || [ -z "${DB_USERNAME:-}" ] || [ -z "${DB_NAME:-}" ]; then
  echo "❌ preflight-deploy-db: DB_HOST/DB_USERNAME/DB_NAME 누락 — 트래픽 전환 전 중단" >&2
  exit 1
fi

MYSQL_DEPLOY_MYSQL_BIN="${MYSQL_DEPLOY_MYSQL_BIN:-${FLYWAY_HEALTH_MYSQL_BIN:-mysql}}"
export MYSQL_DEPLOY_MYSQL_BIN

if ! command -v "$MYSQL_DEPLOY_MYSQL_BIN" >/dev/null 2>&1 && [ ! -x "$MYSQL_DEPLOY_MYSQL_BIN" ]; then
  echo "❌ preflight-deploy-db: mysql 클라이언트 없음 ($MYSQL_DEPLOY_MYSQL_BIN)" >&2
  exit 1
fi

mysql_deploy_prepare
if ! mysql_deploy_query "SELECT 1;"; then
  echo "❌ preflight-deploy-db: SELECT 1 실패 — 트래픽 전환 전 중단" >&2
  mysql_deploy_cleanup
  exit 1
fi
mysql_deploy_cleanup
echo "✅ preflight-deploy-db: SELECT 1 OK"
exit 0
