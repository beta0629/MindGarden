#!/bin/bash

# 운영 데이터베이스 월 1회 자동 백업 스크립트
# 실행: 매월 1일 새벽 2시
# 보존: 12개월 (1년)

# 설정 변수
DB_HOST="beta74.cafe24.com"
DB_NAME="mind_garden"
DB_USER="root"
BACKUP_DIR="/home/backup/database"
LOG_DIR="/home/backup/logs"
RETENTION_MONTHS=12

# 현재 날짜/시간
CURRENT_DATE=$(date +%Y%m%d_%H%M%S)
CURRENT_MONTH=$(date +%Y%m)
LOG_FILE="$LOG_DIR/db_backup_${CURRENT_MONTH}.log"

# 디렉토리 생성
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# 로그 함수
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 백업 시작
log_message "🚀 데이터베이스 백업 시작 - $CURRENT_DATE"

# 백업 파일명
BACKUP_FILE="$BACKUP_DIR/mindgarden_backup_${CURRENT_MONTH}.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# 기존 압축 파일이 있으면 제거
if [ -f "$COMPRESSED_FILE" ]; then
    log_message "⚠️ 기존 백업 파일 제거: $COMPRESSED_FILE"
    rm -f "$COMPRESSED_FILE"
fi

# mysqldump 실행
log_message "📦 데이터베이스 덤프 생성 중..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --complete-insert \
    --extended-insert \
    --lock-tables=false \
    --add-drop-database \
    --add-drop-table \
    --create-options \
    --disable-keys \
    --quick \
    --set-charset \
    --default-character-set=utf8mb4 \
    "$DB_NAME" > "$BACKUP_FILE" 2>> "$LOG_FILE"

# 백업 성공 여부 확인
if [ $? -eq 0 ]; then
    log_message "✅ 데이터베이스 덤프 생성 완료"
    
    # 파일 압축
    log_message "🗜️ 백업 파일 압축 중..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "✅ 백업 파일 압축 완료: $COMPRESSED_FILE"
        
        # 파일 크기 확인
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log_message "📊 백업 파일 크기: $BACKUP_SIZE"
        
        # 오래된 백업 파일 정리
        log_message "🧹 오래된 백업 파일 정리 중..."
        find "$BACKUP_DIR" -name "mindgarden_backup_*.sql.gz" -mtime +$((RETENTION_MONTHS * 30)) -delete 2>/dev/null
        
        # 정리된 파일 목록
        REMAINING_BACKUPS=$(ls -la "$BACKUP_DIR"/mindgarden_backup_*.sql.gz 2>/dev/null | wc -l)
        log_message "📁 보존 중인 백업 파일 수: $REMAINING_BACKUPS개"
        
        # 백업 완료 알림
        log_message "🎉 데이터베이스 백업 완료!"
        log_message "📁 백업 위치: $COMPRESSED_FILE"
        log_message "📅 다음 백업: $(date -d '+1 month' '+%Y년 %m월 1일')"
        
    else
        log_message "❌ 백업 파일 압축 실패"
        exit 1
    fi
    
else
    log_message "❌ 데이터베이스 덤프 생성 실패"
    exit 1
fi

# 백업 상태 파일 생성
echo "LAST_BACKUP_DATE=$CURRENT_DATE" > "$BACKUP_DIR/.backup_status"
echo "LAST_BACKUP_FILE=$COMPRESSED_FILE" >> "$BACKUP_DIR/.backup_status"
echo "BACKUP_SIZE=$BACKUP_SIZE" >> "$BACKUP_DIR/.backup_status"

log_message "✅ 백업 스크립트 완료"
