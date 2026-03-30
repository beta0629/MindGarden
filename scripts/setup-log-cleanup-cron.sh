#!/bin/bash

# 개발 서버 로그 파일 및 백업 파일 자동 정리 Cron 작업 설정 스크립트
# Usage: ./scripts/setup-log-cleanup-cron.sh

set -e

SERVER="root@beta0629.cafe24.com"
LOG_CLEANUP_SCRIPT="/var/www/mindgarden-dev/scripts/clean-dev-server-logs.sh"
BACKUP_CLEANUP_SCRIPT="/var/www/mindgarden-dev/scripts/clean-dev-server-backups.sh"
CRON_SCHEDULE="0 2 * * *"  # 매일 오전 2시 실행

echo "🔧 개발 서버 로그 파일 및 백업 파일 자동 정리 Cron 작업 설정 시작..."
echo "=========================================="
echo ""

# 1. 스크립트 파일을 서버에 업로드
echo "📤 정리 스크립트 업로드..."
ssh $SERVER "mkdir -p /var/www/mindgarden-dev/scripts" || true

# 로그 정리 스크립트 업로드
scp scripts/clean-dev-server-logs.sh $SERVER:$LOG_CLEANUP_SCRIPT
ssh $SERVER "chmod +x $LOG_CLEANUP_SCRIPT"
echo "  ✅ 로그 정리 스크립트 업로드 완료: $LOG_CLEANUP_SCRIPT"

# 백업 정리 스크립트 업로드
scp scripts/clean-dev-server-backups.sh $SERVER:$BACKUP_CLEANUP_SCRIPT
ssh $SERVER "chmod +x $BACKUP_CLEANUP_SCRIPT"
echo "  ✅ 백업 정리 스크립트 업로드 완료: $BACKUP_CLEANUP_SCRIPT"
echo ""

# 2. Cron 작업 추가 (중복 방지)
echo "📅 Cron 작업 설정..."

# 기존 crontab 가져오기
CURRENT_CRONTAB=$(ssh $SERVER "crontab -l 2>/dev/null || echo ''")

# 로그 정리 Cron 작업 추가
LOG_CRON_JOB="$CRON_SCHEDULE $LOG_CLEANUP_SCRIPT 3 >/dev/null 2>&1"
if echo "$CURRENT_CRONTAB" | grep -qF "$LOG_CLEANUP_SCRIPT"; then
    echo "  ℹ️  로그 정리 Cron 작업이 이미 설정되어 있습니다"
else
    ssh $SERVER "(crontab -l 2>/dev/null; echo '$LOG_CRON_JOB') | crontab -"
    echo "  ✅ 로그 정리 Cron 작업 추가 완료"
fi

# 백업 정리 Cron 작업 추가
BACKUP_CRON_JOB="$CRON_SCHEDULE $BACKUP_CLEANUP_SCRIPT 3 >/dev/null 2>&1"
if echo "$CURRENT_CRONTAB" | grep -qF "$BACKUP_CLEANUP_SCRIPT"; then
    echo "  ℹ️  백업 정리 Cron 작업이 이미 설정되어 있습니다"
else
    ssh $SERVER "(crontab -l 2>/dev/null; echo '$BACKUP_CRON_JOB') | crontab -"
    echo "  ✅ 백업 정리 Cron 작업 추가 완료"
fi

echo "  실행 시간: 매일 오전 2시"
echo "  삭제 대상: 3일 이상 된 로그 및 백업 파일"
echo ""

# 3. Cron 작업 확인
echo "📋 현재 Cron 작업 목록 (정리 관련)"
ssh $SERVER "crontab -l | grep -E '(clean|log|backup)' || echo '  (관련 작업 없음)'"
echo ""

echo "=========================================="
echo "✅ 로그 파일 및 백업 파일 자동 정리 Cron 작업 설정 완료"
echo ""
echo "💡 설정 내용:"
echo "  - 실행 시간: 매일 오전 2시"
echo "  - 로그 파일: 3일 이상 된 파일 자동 삭제"
echo "  - 백업 파일: 3일 이상 된 파일 자동 삭제"
echo "  - 로그 정리 스크립트: $LOG_CLEANUP_SCRIPT"
echo "  - 백업 정리 스크립트: $BACKUP_CLEANUP_SCRIPT"
echo "  - Cron 작업 확인: ssh $SERVER 'crontab -l'"
echo ""

