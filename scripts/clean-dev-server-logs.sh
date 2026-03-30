#!/bin/bash

# 개발 서버 로그 파일 정리 스크립트
# Usage: 
#   로컬에서 실행: ./scripts/clean-dev-server-logs.sh [days]
#   서버에서 직접 실행: ./clean-dev-server-logs.sh [days] (자동 모드)
# 기본값: 7일
# Cron 작업용 자동 실행 시: 3일 (3일치만 남기고 모두 삭제)

set -e

# 서버에서 직접 실행되는지 확인 (Cron 작업)
if [ -f "/var/www/mindgarden-dev/scripts/clean-dev-server-logs.sh" ]; then
    # 서버에서 직접 실행 (자동 모드)
    SERVER=""
    AUTO_MODE="yes"
    DAYS=${1:-3}  # 자동 실행 시 기본값: 3일
else
    # 로컬에서 원격 서버에 SSH로 실행
    SERVER="root@beta0629.cafe24.com"
    AUTO_MODE="no"
    DAYS=${1:-7}  # 로컬 실행 시 기본값: 7일
fi

# 실행 모드에 따라 메시지 출력
if [ "$AUTO_MODE" = "yes" ]; then
    LOG_DIR="/var/www/mindgarden-dev/logs"
    LOG_FILE="/var/www/mindgarden-dev/logs/log-cleanup.log"
else
    LOG_DIR="/var/www/mindgarden-dev/logs"
    LOG_FILE=""
fi

# 로그 함수
log_message() {
    local message="$1"
    if [ "$AUTO_MODE" = "yes" ] && [ -n "$LOG_FILE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
    else
        echo "$message"
    fi
}

if [ "$AUTO_MODE" = "yes" ]; then
    log_message "🧹 로그 파일 자동 정리 시작 (${DAYS}일 이상)"
else
    echo "🧹 개발 서버 로그 파일 정리 시작..."
    echo "=========================================="
    echo ""
fi

# 1. 현재 로그 디렉토리 크기 확인
if [ "$AUTO_MODE" = "yes" ]; then
    LOG_SIZE_BEFORE=$(du -sh "$LOG_DIR" 2>/dev/null | awk '{print $1}' || echo '0')
    log_message "📊 현재 로그 디렉토리 크기: ${LOG_SIZE_BEFORE}"
else
    echo "📊 현재 로그 디렉토리 크기"
    LOG_SIZE_BEFORE=$(ssh $SERVER "du -sh /var/www/mindgarden-dev/logs 2>/dev/null | awk '{print \$1}' || echo '0'")
    echo "  현재 크기: ${LOG_SIZE_BEFORE}"
    echo ""
fi

# 2. 삭제 대상 로그 파일 수 확인
if [ "$AUTO_MODE" = "yes" ]; then
    OLD_LOG_COUNT=$(find "$LOG_DIR" -name '*.log' -mtime +${DAYS} 2>/dev/null | wc -l)
else
    echo "🔍 ${DAYS}일 이상 된 로그 파일 확인"
    OLD_LOG_COUNT=$(ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +${DAYS} 2>/dev/null | wc -l")
fi

if [ "$OLD_LOG_COUNT" -eq "0" ]; then
    log_message "  ✅ 삭제할 로그 파일이 없습니다"
    exit 0
fi

if [ "$AUTO_MODE" = "yes" ]; then
    log_message "  삭제 대상: ${OLD_LOG_COUNT}개"
else
    echo "  삭제 대상: ${OLD_LOG_COUNT}개"
    echo ""
    
    # 3. 삭제 대상 파일 미리보기 (로컬 실행 시에만)
    echo "📋 삭제 대상 파일 (샘플)"
    ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +${DAYS} 2>/dev/null | head -10 | while read file; do ls -lh \"\$file\" | awk '{printf \"  - %s (%s)\\n\", \$9, \$5}'; done"
    echo ""
    
    # 4. 사용자 확인
    read -p "위 로그 파일들을 삭제하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 취소되었습니다"
        exit 1
    fi
fi

# 5. 로그 파일 삭제
if [ "$AUTO_MODE" = "yes" ]; then
    log_message "🗑️  로그 파일 삭제 중..."
    if find "$LOG_DIR" -name '*.log' -mtime +${DAYS} -delete 2>/dev/null; then
        log_message "  ✅ 로그 파일 삭제 완료"
    else
        log_message "  ⚠️  로그 파일 삭제 중 오류 발생"
        exit 1
    fi
else
    echo "🗑️  로그 파일 삭제 중..."
    DELETED_COUNT=$(ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +${DAYS} -delete 2>/dev/null && echo 'OK' || echo 'FAILED'")
    
    if [ "$DELETED_COUNT" = "OK" ]; then
        echo "  ✅ 로그 파일 삭제 완료"
    else
        echo "  ⚠️  로그 파일 삭제 중 오류 발생"
        exit 1
    fi
fi

# 6. 정리 후 로그 디렉토리 크기 확인
if [ "$AUTO_MODE" = "yes" ]; then
    LOG_SIZE_AFTER=$(du -sh "$LOG_DIR" 2>/dev/null | awk '{print $1}' || echo '0')
    log_message "📊 정리 후 로그 디렉토리 크기: ${LOG_SIZE_AFTER}"
    
    # 디스크 사용량
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
    log_message "💾 디스크 사용률: ${DISK_USAGE}"
    
    log_message "✅ 로그 파일 정리 완료 - 삭제: ${OLD_LOG_COUNT}개, 정리 전: ${LOG_SIZE_BEFORE}, 정리 후: ${LOG_SIZE_AFTER}"
else
    echo ""
    echo "📊 정리 후 로그 디렉토리 크기"
    LOG_SIZE_AFTER=$(ssh $SERVER "du -sh /var/www/mindgarden-dev/logs 2>/dev/null | awk '{print \$1}' || echo '0'")
    echo "  정리 후 크기: ${LOG_SIZE_AFTER}"
    echo ""
    
    # 7. 디스크 사용량 확인
    echo "💾 디스크 사용량 확인"
    DISK_USAGE=$(ssh $SERVER "df -h / | awk 'NR==2 {print \$5}'")
    echo "  디스크 사용률: ${DISK_USAGE}"
    echo ""
    
    echo "=========================================="
    echo "✅ 로그 파일 정리 완료"
    echo "  - 삭제된 파일: 약 ${OLD_LOG_COUNT}개"
    echo "  - 정리 전: ${LOG_SIZE_BEFORE}"
    echo "  - 정리 후: ${LOG_SIZE_AFTER}"
    echo ""
fi

