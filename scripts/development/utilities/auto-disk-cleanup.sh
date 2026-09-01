#!/bin/bash

# 개발 서버 디스크 정리 (일 배치 + 고사용률 추가 정리)
# - 항상: 백업 최신 5개, 앱 로그 7일, journal 7일, MySQL binlog 3일
# - 80% 이상일 때만: syslog gz, /tmp
# cron PATH 에서도 동작하도록 경로를 고정한다.

PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PATH

set -e

THRESHOLD=80
TARGET_FREE=20
KEEP_BACKUP_COUNT=5
APP_LOG_MTIME_DAYS=7
JOURNAL_VACUUM_TIME="7d"
BINLOG_EXPIRE_DAYS=3
SYSLOG_MTIME_DAYS=3
GZ_LOG_MTIME_DAYS=7
TMP_MTIME_DAYS=1

DEV_BACKUP_DIR="/var/www/mindgarden-dev/backups"
APP_LOG_DIR="/var/www/mindgarden-dev/logs"
HTML_BACKUP_ROOT="/var/www/backups"
DEV_ENV_FILE="/etc/mindgarden/dev.env"

print_disk_status() {
    local label="$1"
    local usage used free
    usage="$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')"
    usage="${usage:-0}"
    used="$(df -h / | awk 'NR==2 {print $3}')"
    free="$(df -h / | awk 'NR==2 {print $4}')"
    echo "📊 ${label}:"
    echo "  사용: ${used} (${usage}%)"
    echo "  여유: ${free} ($((100 - usage))%)"
}

# 패턴별 최신 N개만 유지 (배포 워크플로와 동일: ls -t | tail -n +N+1)
keep_latest_in_dir() {
    local dir="$1"
    local glob_pattern="$2"
    local keep_count="${3:-$KEEP_BACKUP_COUNT}"

    if [ ! -d "$dir" ]; then
        echo "  skip: 디렉터리 없음 ($dir)"
        return 0
    fi

    (
        cd "$dir" || exit 0
        # glob 확장을 위해 패턴은 따옴표 없이 전달한다.
        ls -t $glob_pattern 2>/dev/null | tail -n +$((keep_count + 1)) | xargs -r rm -f || true
    ) || true
    echo "  유지: ${dir} / ${glob_pattern} 최신 ${keep_count}개"
}

# MySQL binlog만 만료. datadir / *.ibd 는 절대 삭제하지 않는다.
# cron 은 root 이므로 unix_socket 을 우선한다. 앱 DB 계정은 BINLOG 권한이 없는 경우가 많다.
purge_mysql_binlogs() {
    local sql="PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL ${BINLOG_EXPIRE_DAYS} DAY);"
    local purge_rc=1

    set +e
    mysql --protocol=SOCKET --connect-timeout=10 -e "$sql" >/dev/null 2>&1
    purge_rc=$?
    set -e

    if [ "$purge_rc" -eq 0 ]; then
        echo "  binlog: ${BINLOG_EXPIRE_DAYS}일 이전 PURGE 완료"
        return 0
    fi

    if [ ! -f "$DEV_ENV_FILE" ]; then
        echo "  binlog: 정리 실패 또는 권한 없음 (무시). 데이터 파일은 삭제하지 않음"
        return 0
    fi

    set +e
    # shellcheck disable=SC1090
    source "$DEV_ENV_FILE" >/dev/null 2>&1
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-3306}"
    local db_user="${DB_USERNAME:-}"
    export MYSQL_PWD="${DB_PASSWORD:-}"
    unset DB_PASSWORD
    mysql --host="$db_host" --port="$db_port" --user="$db_user" --connect-timeout=10 \
        -e "$sql" >/dev/null 2>&1
    purge_rc=$?
    unset MYSQL_PWD DB_PASSWORD 2>/dev/null || true
    set -e

    if [ "$purge_rc" -eq 0 ]; then
        echo "  binlog: ${BINLOG_EXPIRE_DAYS}일 이전 PURGE 완료"
    else
        echo "  binlog: 정리 실패 또는 권한 없음 (무시). 데이터 파일은 삭제하지 않음"
    fi
    return 0
}

echo "🔍 디스크 공간 모니터링 및 자동 정리"
echo "=================================="

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_FREE=$(df -h / | awk 'NR==2 {print $4}')
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
DISK_USED=$(df -h / | awk 'NR==2 {print $3}')
DISK_USAGE="${DISK_USAGE:-0}"

echo "📊 현재 디스크 상태:"
echo "  전체: $DISK_TOTAL"
echo "  사용: $DISK_USED ($DISK_USAGE%)"
echo "  여유: $DISK_FREE ($((100 - DISK_USAGE))%)"
echo ""

echo "📦 일 배치 정리 (디스크 ${THRESHOLD}%와 무관)"
echo ""

echo "🧹 1. 앱 JAR/프론트 백업 최신 ${KEEP_BACKUP_COUNT}개 유지..."
keep_latest_in_dir "$DEV_BACKUP_DIR" "app.jar.backup.*" "$KEEP_BACKUP_COUNT"
keep_latest_in_dir "$DEV_BACKUP_DIR" "frontend.backup.*.tar.gz" "$KEEP_BACKUP_COUNT"

echo "🧹 2. HTML 정적 백업 최신 ${KEEP_BACKUP_COUNT}개 유지..."
keep_latest_in_dir "${HTML_BACKUP_ROOT}/html-dev" "html-dev-backup-*.tar.gz" "$KEEP_BACKUP_COUNT"
keep_latest_in_dir "${HTML_BACKUP_ROOT}/html-trinity" "html-trinity-backup-*.tar.gz" "$KEEP_BACKUP_COUNT"
keep_latest_in_dir "${HTML_BACKUP_ROOT}/html-ops" "html-ops-backup-*.tar.gz" "$KEEP_BACKUP_COUNT"

echo "🧹 3. 애플리케이션 로그 (${APP_LOG_MTIME_DAYS}일 이상)..."
if [ -d "$APP_LOG_DIR" ]; then
    find "$APP_LOG_DIR" -type f -mtime +"$APP_LOG_MTIME_DAYS" -delete 2>/dev/null || true
    echo "  ✅ ${APP_LOG_DIR} 정리 완료"
else
    echo "  skip: 애플리케이션 로그 디렉터리 없음"
fi

echo "🧹 4. journal 로그 (${JOURNAL_VACUUM_TIME})..."
journalctl --vacuum-time="$JOURNAL_VACUUM_TIME" >/dev/null 2>&1 || true
echo "  ✅ journal 정리 완료 (실패 시 무시)"

echo "🧹 5. MySQL binlog (${BINLOG_EXPIRE_DAYS}일)..."
purge_mysql_binlogs || true
echo ""

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_USAGE="${DISK_USAGE:-0}"
print_disk_status "배치 후 디스크 상태"
echo ""

if [ "$DISK_USAGE" -lt "$THRESHOLD" ]; then
    echo "✅ 디스크 사용률이 ${THRESHOLD}% 미만입니다. 추가 정리 없음."
    echo ""
    echo "✅ 디스크 정리 완료"
    exit 0
fi

echo "⚠️ 디스크 사용률이 ${THRESHOLD}% 이상입니다. 추가 정리 시작..."
echo ""

echo "🧹 6. syslog / 압축 로그 정리..."
find /var/log -name "syslog.*" -type f -mtime +"$SYSLOG_MTIME_DAYS" -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +"$GZ_LOG_MTIME_DAYS" -delete 2>/dev/null || true
echo "✅ syslog 파일 정리 완료"

echo "🧹 7. /tmp 정리 (${TMP_MTIME_DAYS}일 이상)..."
find /tmp -type f -mtime +"$TMP_MTIME_DAYS" -delete 2>/dev/null || true
echo "✅ /tmp 정리 완료"

echo ""
print_disk_status "정리 후 디스크 상태"

DISK_USAGE_AFTER=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_USAGE_AFTER="${DISK_USAGE_AFTER:-0}"
if [ "$DISK_USAGE_AFTER" -lt "$((100 - TARGET_FREE))" ]; then
    echo ""
    echo "✅ 목표 달성: 여유 공간 ${TARGET_FREE}% 이상 확보 완료"
else
    echo ""
    echo "⚠️ 경고: 여전히 디스크 사용률이 높습니다. 추가 정리가 필요할 수 있습니다."
fi

echo ""
echo "✅ 디스크 정리 완료"
