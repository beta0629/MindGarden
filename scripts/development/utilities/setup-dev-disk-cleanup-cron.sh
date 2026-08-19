#!/bin/bash

# 개발 서버 디스크 정리 일 배치 cron 설치
# 서버에서 root 로 한 번 실행한다.
#   sudo bash /opt/mindgarden/scripts/development/utilities/setup-dev-disk-cleanup-cron.sh

PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PATH

set -e

CRON_MINUTE=15
CRON_HOUR=4
LOG_FILE="/var/log/mindgarden-dev-disk-cleanup.log"
FALLBACK_CLEANUP_SCRIPT="/opt/mindgarden/scripts/development/utilities/auto-disk-cleanup.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SCRIPT="${SCRIPT_DIR}/auto-disk-cleanup.sh"

if [ ! -f "$CLEANUP_SCRIPT" ]; then
    CLEANUP_SCRIPT="$FALLBACK_CLEANUP_SCRIPT"
fi

if [ ! -f "$CLEANUP_SCRIPT" ]; then
    echo "❌ auto-disk-cleanup.sh 를 찾을 수 없습니다."
    echo "  시도: ${SCRIPT_DIR}/auto-disk-cleanup.sh"
    echo "  시도: ${FALLBACK_CLEANUP_SCRIPT}"
    exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
    echo "❌ root 로 실행하세요. journal/mysql/백업 경로 정리는 root cron 이 필요합니다."
    echo "  sudo bash ${CLEANUP_SCRIPT%/*}/setup-dev-disk-cleanup-cron.sh"
    exit 1
fi

chmod +x "$CLEANUP_SCRIPT"

touch "$LOG_FILE"
chmod 640 "$LOG_FILE"

CRON_LINE="${CRON_MINUTE} ${CRON_HOUR} * * * ${CLEANUP_SCRIPT} >> ${LOG_FILE} 2>&1"

echo "🔧 개발 서버 디스크 정리 cron 설정"
echo "=================================="
echo "  스크립트: ${CLEANUP_SCRIPT}"
echo "  일정: 매일 ${CRON_HOUR}:${CRON_MINUTE}"
echo "  로그: ${LOG_FILE}"
echo ""

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v "auto-disk-cleanup.sh" | grep -v "mindgarden-dev-disk-cleanup" > "$TMP_CRON" || true
echo "$CRON_LINE" >> "$TMP_CRON"
crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "✅ cron 설치 완료 (동일 작업 중복 제거 후 1줄만 유지)"
echo ""
echo "📋 현재 디스크 정리 cron:"
crontab -l | grep -E "auto-disk-cleanup|mindgarden-dev-disk-cleanup" || echo "  (없음)"
echo ""
echo "수동 실행: ${CLEANUP_SCRIPT}"
