#!/bin/bash

# 데이터베이스 백업 Cron 설정 스크립트
# 실행: 서버 설정 시 한 번만 실행

SCRIPT_DIR="/home/scripts"
BACKUP_SCRIPT="$SCRIPT_DIR/database-backup.sh"
MONITOR_SCRIPT="$SCRIPT_DIR/backup-monitor.sh"
RESTORE_SCRIPT="$SCRIPT_DIR/database-restore.sh"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_message "🔧 데이터베이스 백업 Cron 설정 시작"

# 스크립트 디렉토리 생성
mkdir -p "$SCRIPT_DIR"

# 스크립트 파일 복사
if [ -f "database-backup.sh" ]; then
    cp database-backup.sh "$BACKUP_SCRIPT"
    chmod +x "$BACKUP_SCRIPT"
    log_message "✅ 백업 스크립트 복사 완료"
else
    log_error "❌ database-backup.sh 파일을 찾을 수 없습니다"
    exit 1
fi

if [ -f "backup-monitor.sh" ]; then
    cp backup-monitor.sh "$MONITOR_SCRIPT"
    chmod +x "$MONITOR_SCRIPT"
    log_message "✅ 모니터링 스크립트 복사 완료"
else
    log_error "❌ backup-monitor.sh 파일을 찾을 수 없습니다"
    exit 1
fi

if [ -f "database-restore.sh" ]; then
    cp database-restore.sh "$RESTORE_SCRIPT"
    chmod +x "$RESTORE_SCRIPT"
    log_message "✅ 복원 스크립트 복사 완료"
else
    log_error "❌ database-restore.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 백업 디렉토리 생성
mkdir -p /home/backup/database
mkdir -p /home/backup/logs
log_message "✅ 백업 디렉토리 생성 완료"

# 기존 Cron 백업 작업 제거
log_message "🧹 기존 백업 Cron 작업 제거 중..."
crontab -l 2>/dev/null | grep -v "database-backup.sh" | grep -v "backup-monitor.sh" | crontab -

# 새로운 Cron 작업 추가
log_message "📅 새로운 Cron 작업 추가 중..."

# 백업 작업: 매월 1일 새벽 2시
(crontab -l 2>/dev/null; echo "0 2 1 * * $BACKUP_SCRIPT >> /home/backup/logs/cron_backup.log 2>&1") | crontab -

# 모니터링 작업: 매일 새벽 3시
(crontab -l 2>/dev/null; echo "0 3 * * * $MONITOR_SCRIPT >> /home/backup/logs/cron_monitor.log 2>&1") | crontab -

# Cron 작업 확인
log_message "📋 설정된 Cron 작업:"
crontab -l | grep -E "(database-backup|backup-monitor)"

# 다음 실행 시간 계산
NEXT_BACKUP=$(date -d "$(date +%Y-%m-01) +1 month" '+%Y년 %m월 %d일 02:00')
NEXT_MONITOR=$(date -d '+1 day' '+%Y년 %m월 %d일 03:00')

log_message "⏰ 다음 백업 실행: $NEXT_BACKUP"
log_message "⏰ 다음 모니터링: $NEXT_MONITOR"

# Cron 서비스 상태 확인
if systemctl is-active --quiet cron; then
    log_message "✅ Cron 서비스가 실행 중입니다"
else
    log_warning "⚠️ Cron 서비스가 실행되지 않았습니다. 수동으로 시작하세요:"
    echo "  sudo systemctl start cron"
    echo "  sudo systemctl enable cron"
fi

log_message "🎉 데이터베이스 백업 Cron 설정 완료!"

echo ""
echo "📋 설정 요약:"
echo "  - 백업 스크립트: $BACKUP_SCRIPT"
echo "  - 모니터링 스크립트: $MONITOR_SCRIPT"
echo "  - 복원 스크립트: $RESTORE_SCRIPT"
echo "  - 백업 디렉토리: /home/backup/database"
echo "  - 로그 디렉토리: /home/backup/logs"
echo ""
echo "🔧 수동 실행:"
echo "  - 백업: $BACKUP_SCRIPT"
echo "  - 모니터링: $MONITOR_SCRIPT"
echo "  - 복원: $RESTORE_SCRIPT [백업파일명]"
