#!/usr/bin/env bash
# MindGarden 운영 MySQL 일일 덤프 (cron용)
# 환경: MYSQL_BACKUP_ENV_FILE 기본 /etc/mindgarden/backup-mysql.env (DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD)
# 보관: MYSQL_BACKUP_RETENTION_DAYS / env의 RETENTION_DAYS, 기본 3일

set -euo pipefail

ENV_FILE="${MYSQL_BACKUP_ENV_FILE:-/etc/mindgarden/backup-mysql.env}"
BACKUP_ROOT="${MYSQL_BACKUP_DIR:-/var/backups/mindgarden/mysql}"
RETENTION_DAYS="${MYSQL_BACKUP_RETENTION_DAYS:-3}"

umask 077
mkdir -p "$BACKUP_ROOT"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "$(date -Is) ERROR: missing $ENV_FILE" >&2
  exit 1
fi
# shellcheck source=/dev/null
set -a
source "$ENV_FILE"
set +a

: "${DB_USERNAME:?}"
: "${DB_NAME:?}"
: "${DB_PASSWORD:?}"

export MYSQL_PWD="$DB_PASSWORD"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_ROOT/core_solution_${STAMP}.sql.gz"

# PROCESS 없이도 덤프 가능하도록 --no-tablespaces
# 앱 DB 계정에 SHOW ROUTINE 권한이 없을 수 있어 루틴은 제외(스키마·데이터 위주). 전체 루틴 백업은 DBA 권한 계정 권장.
mysqldump \
  -h"${DB_HOST:-127.0.0.1}" \
  -P"${DB_PORT:-3306}" \
  -u"$DB_USERNAME" \
  "$DB_NAME" \
  --single-transaction \
  --quick \
  --no-tablespaces \
  --triggers \
  --set-gtid-purged=OFF \
  | gzip -1 >"$OUT"

unset MYSQL_PWD

find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'core_solution_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "$(date -Is) OK $OUT size=$(du -h "$OUT" | cut -f1)"
