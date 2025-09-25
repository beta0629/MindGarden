#!/bin/bash

# 데이터베이스 백업 상태 모니터링 스크립트
# 실행: 매일 새벽 3시 (백업 후 1시간 뒤)

BACKUP_DIR="/home/backup/database"
LOG_DIR="/home/backup/logs"
STATUS_FILE="$BACKUP_DIR/.backup_status"
CURRENT_MONTH=$(date +%Y%m)
LOG_FILE="$LOG_DIR/backup_monitor_${CURRENT_MONTH}.log"

# 디렉토리 생성
mkdir -p "$LOG_DIR"

# 로그 함수
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "🔍 백업 상태 모니터링 시작"

# 백업 상태 파일 확인
if [ -f "$STATUS_FILE" ]; then
    source "$STATUS_FILE"
    log_message "📅 마지막 백업: $LAST_BACKUP_DATE"
    log_message "📁 백업 파일: $LAST_BACKUP_FILE"
    log_message "📊 백업 크기: $BACKUP_SIZE"
    
    # 백업 파일 존재 확인
    if [ -f "$LAST_BACKUP_FILE" ]; then
        log_message "✅ 백업 파일 존재 확인됨"
        
        # 파일 무결성 확인 (gzip 테스트)
        if gzip -t "$LAST_BACKUP_FILE" 2>/dev/null; then
            log_message "✅ 백업 파일 무결성 확인됨"
        else
            log_message "❌ 백업 파일 손상됨!"
        fi
        
    else
        log_message "❌ 백업 파일이 존재하지 않음!"
    fi
    
else
    log_message "⚠️ 백업 상태 파일이 없습니다"
fi

# 디스크 사용량 확인
BACKUP_USAGE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log_message "💾 백업 디렉토리 사용량: $BACKUP_USAGE"

# 백업 파일 목록
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/mindgarden_backup_*.sql.gz 2>/dev/null | wc -l)
log_message "📁 백업 파일 수: $BACKUP_COUNT개"

# 다음 백업까지 남은 일수 계산
NEXT_BACKUP_DATE=$(date -d "$(date +%Y-%m-01) +1 month" '+%Y-%m-%d')
DAYS_UNTIL_NEXT=$(( ($(date -d "$NEXT_BACKUP_DATE" +%s) - $(date +%s)) / 86400 ))
log_message "⏰ 다음 백업까지: $DAYS_UNTIL_NEXT일"

# 경고 조건 확인
if [ $DAYS_UNTIL_NEXT -lt 7 ]; then
    log_message "⚠️ 다음 백업이 7일 이내입니다"
fi

if [ $BACKUP_COUNT -eq 0 ]; then
    log_message "❌ 백업 파일이 없습니다!"
fi

log_message "✅ 백업 모니터링 완료"
