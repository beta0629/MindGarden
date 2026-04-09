#!/usr/bin/env bash
#
# 운영 DB 스냅샷을 개발 DB로 일일 반영 (배치용)
#
# D-1 의미:
#   - SYNC_MODE=from_file: 파일명에 포함된 "전일(어제) 날짜" 덤프를 사용 (운영 측이 전일분을 남겨야 함)
#   - SYNC_MODE=dump_live: 실행 시점의 운영 스냅샷을 개발에 넣음 (스케줄을 새벽에 두면 전일 업무 데이터에 가깝게 유지 가능)
#
# 설정 파일(우선순위):
#   1) /etc/mindgarden/prod-to-dev-sync.env
#   2) 동일 디렉터리의 prod-to-dev-daily.env
#
# 사용 예:
#   NON_INTERACTIVE=1 /opt/mindgarden/scripts/database/sync/prod-to-dev-daily.sh
#
# 권장 스케줄: 매일 새벽(예: 03:30 KST) — crontab.example 참고 (CRON_TZ=Asia/Seoul)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
umask 077

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

die() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
  exit 1
}

yesterday_ymd() {
  if ymd="$(date -d yesterday +%Y%m%d 2>/dev/null)"; then
    echo "$ymd"
    return 0
  fi
  date -v-1d +%Y%m%d
}

yesterday_ymd_dash() {
  if ymd="$(date -d yesterday +%Y-%m-%d 2>/dev/null)"; then
    echo "$ymd"
    return 0
  fi
  date -v-1d +%Y-%m-%d
}

# 설정 로드
if [[ -f /etc/mindgarden/prod-to-dev-sync.env ]]; then
  # shellcheck source=/dev/null
  source /etc/mindgarden/prod-to-dev-sync.env
elif [[ -f "$SCRIPT_DIR/prod-to-dev-daily.env" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/prod-to-dev-daily.env"
else
  die "설정 파일이 없습니다. /etc/mindgarden/prod-to-dev-sync.env 또는 $SCRIPT_DIR/prod-to-dev-daily.env 를 준비하세요."
fi

SYNC_MODE="${SYNC_MODE:-dump_live}"
TMP_DIR="${TMP_DIR:-/var/tmp}"
LOG_DIR="${LOG_DIR:-/var/log/mindgarden}"
RETAIN_LOCAL_DUMPS="${RETAIN_LOCAL_DUMPS:-0}"
NON_INTERACTIVE="${NON_INTERACTIVE:-0}"

PROD_MYSQL_PORT="${PROD_MYSQL_PORT:-3306}"
DEV_MYSQL_PORT="${DEV_MYSQL_PORT:-3306}"

[[ -n "${PROD_MYSQL_HOST:-}" ]] || die "PROD_MYSQL_HOST 미설정"
[[ -n "${PROD_DB_NAME:-}" ]] || die "PROD_DB_NAME 미설정"
[[ -n "${DEV_MYSQL_HOST:-}" ]] || die "DEV_MYSQL_HOST 미설정"
[[ -n "${DEV_DB_NAME:-}" ]] || die "DEV_DB_NAME 미설정"
[[ -n "${DEV_MYSQL_USER:-}" ]] || die "DEV_MYSQL_USER 미설정"

PROD_MYSQL_USER="${PROD_MYSQL_USER:-}"
EXTRA_DUMP_OPTS="${EXTRA_DUMP_OPTS:-}"

mkdir -p "$LOG_DIR"
RUN_ID="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIR}/prod-to-dev-sync_${RUN_ID}.log"

exec > >(tee -a "$LOG_FILE") 2>&1

log "=== 운영→개발 DB 동기화 시작 (mode=$SYNC_MODE, D-1 label=$(yesterday_ymd_dash)) ==="

mysql_prod() {
  mysql -h "$PROD_MYSQL_HOST" -P "$PROD_MYSQL_PORT" -u "$PROD_MYSQL_USER" \
    ${PROD_MYSQL_PASSWORD:+-p"$PROD_MYSQL_PASSWORD"} "$@"
}

mysql_dev() {
  mysql -h "$DEV_MYSQL_HOST" -P "$DEV_MYSQL_PORT" -u "$DEV_MYSQL_USER" \
    ${DEV_MYSQL_PASSWORD:+-p"$DEV_MYSQL_PASSWORD"} "$@"
}

mysqldump_prod() {
  mysqldump -h "$PROD_MYSQL_HOST" -P "$PROD_MYSQL_PORT" -u "$PROD_MYSQL_USER" \
    ${PROD_MYSQL_PASSWORD:+-p"$PROD_MYSQL_PASSWORD"} \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --complete-insert \
    --extended-insert \
    --lock-tables=false \
    --set-gtid-purged=OFF \
    --set-charset \
    --default-character-set=utf8mb4 \
    $EXTRA_DUMP_OPTS \
    "$PROD_DB_NAME"
}

if [[ "$NON_INTERACTIVE" != "1" ]]; then
  echo "개발 DB '${DEV_DB_NAME}' @ ${DEV_MYSQL_HOST} 데이터가 덮어씌워집니다. 계속하려면 yes 입력:"
  read -r confirm
  [[ "$confirm" == "yes" ]] || die "사용자 취소"
fi

DUMP_FILE=""

if [[ "$SYNC_MODE" == "from_file" ]]; then
  [[ -n "${DUMP_DIR:-}" ]] || die "SYNC_MODE=from_file 인데 DUMP_DIR 미설정"
  PREFIX="${DUMP_FILE_PREFIX:-mind_garden_}"
  YD="$(yesterday_ymd)"
  CAND="${DUMP_DIR}/${PREFIX}${YD}.sql.gz"
  [[ -f "$CAND" ]] || die "전일 덤프 파일 없음: $CAND"
  DUMP_FILE="$CAND"
  log "전일(D-1) 덤프 사용: $DUMP_FILE"
elif [[ "$SYNC_MODE" == "dump_live" ]]; then
  [[ -n "$PROD_MYSQL_USER" ]] || die "dump_live 모드는 PROD_MYSQL_USER 필수"
  DUMP_FILE="${TMP_DIR}/mindgarden_prod_dump_${RUN_ID}.sql.gz"
  log "운영 덤프 생성 → $DUMP_FILE"
  mysqldump_prod | gzip > "$DUMP_FILE"
  log "덤프 완료 ($(du -h "$DUMP_FILE" | cut -f1))"
else
  die "알 수 없는 SYNC_MODE=$SYNC_MODE (dump_live | from_file 만 허용)"
fi

if ! gzip -t "$DUMP_FILE" 2>/dev/null; then
  die "덤프 gzip 무결성 실패: $DUMP_FILE"
fi

log "개발 DB 초기화 (DROP/CREATE) 후 복원"
mysql_dev -e "DROP DATABASE IF EXISTS \`${DEV_DB_NAME}\`; CREATE DATABASE \`${DEV_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
gunzip -c "$DUMP_FILE" | mysql -h "$DEV_MYSQL_HOST" -P "$DEV_MYSQL_PORT" -u "$DEV_MYSQL_USER" \
  ${DEV_MYSQL_PASSWORD:+-p"$DEV_MYSQL_PASSWORD"} \
  --default-character-set=utf8mb4 \
  "$DEV_DB_NAME"

if [[ -n "${POST_SYNC_SQL_FILE:-}" && -f "$POST_SYNC_SQL_FILE" ]]; then
  log "후처리 SQL 실행: $POST_SYNC_SQL_FILE"
  mysql_dev "$DEV_DB_NAME" < "$POST_SYNC_SQL_FILE"
fi

if [[ "$SYNC_MODE" == "dump_live" && "$RETAIN_LOCAL_DUMPS" != "1" ]]; then
  rm -f "$DUMP_FILE"
  log "임시 덤프 삭제"
fi

log "=== 완료: 개발 DB=${DEV_DB_NAME}, 참고 D-1 날짜 라벨=$(yesterday_ymd_dash) ==="
