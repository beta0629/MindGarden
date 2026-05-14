#!/usr/bin/env bash
# MindGarden 운영 MySQL 백업 파일 보관 정리 (cron용)
# mysqldump 실패로 mysql-daily-backup.sh 가 중단돼도 오래된 덤프를 삭제하기 위해 분리 실행 권장.
# 환경: MYSQL_BACKUP_ENV_FILE, MYSQL_BACKUP_DIR, MYSQL_BACKUP_RETENTION_DAYS
#       (기본 env 파일의 RETENTION_DAYS, 없으면 3일)

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

find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'core_solution_*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete | while read -r f; do
  echo "$(date -Is) PRUNE removed $f (>${RETENTION_DAYS} days)"
done

echo "$(date -Is) PRUNE done keep<=${RETENTION_DAYS}d under $BACKUP_ROOT"
