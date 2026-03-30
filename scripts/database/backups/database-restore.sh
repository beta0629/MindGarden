#!/bin/bash

# 데이터베이스 백업 복원 스크립트
# 사용법: ./database-restore.sh [백업파일명]

# 설정 변수
DB_HOST="beta74.cafe24.com"
DB_NAME="mind_garden"
DB_USER="root"
BACKUP_DIR="/home/backup/database"

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

# 사용법 출력
show_usage() {
    echo "사용법: $0 [백업파일명]"
    echo ""
    echo "사용 가능한 백업 파일:"
    ls -la "$BACKUP_DIR"/mindgarden_backup_*.sql.gz 2>/dev/null | awk '{print "  " $9}' | sed 's|.*/||'
    echo ""
    echo "예시:"
    echo "  $0 mindgarden_backup_202412.sql.gz"
    echo "  $0 (최신 백업 자동 선택)"
}

# 백업 파일 확인
if [ $# -eq 0 ]; then
    # 최신 백업 파일 자동 선택
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/mindgarden_backup_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        log_error "백업 파일을 찾을 수 없습니다"
        show_usage
        exit 1
    fi
    log_message "최신 백업 파일 자동 선택: $(basename "$BACKUP_FILE")"
else
    BACKUP_FILE="$BACKUP_DIR/$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
        show_usage
        exit 1
    fi
fi

log_message "🔄 데이터베이스 복원 시작"
log_message "📁 백업 파일: $BACKUP_FILE"

# 백업 파일 무결성 확인
log_message "🔍 백업 파일 무결성 확인 중..."
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_error "백업 파일이 손상되었습니다"
    exit 1
fi
log_message "✅ 백업 파일 무결성 확인됨"

# 복원 확인
log_warning "⚠️ 주의: 이 작업은 현재 데이터베이스를 완전히 덮어씁니다!"
log_warning "⚠️ 복원 후 모든 현재 데이터가 삭제됩니다!"
echo ""
read -p "정말로 복원하시겠습니까? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_message "복원이 취소되었습니다"
    exit 0
fi

# 현재 데이터베이스 백업 (안전장치)
log_message "🛡️ 현재 데이터베이스 안전 백업 생성 중..."
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
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
    "$DB_NAME" | gzip > "$SAFETY_BACKUP"

if [ $? -eq 0 ]; then
    log_message "✅ 안전 백업 생성 완료: $SAFETY_BACKUP"
else
    log_error "❌ 안전 백업 생성 실패"
    exit 1
fi

# 데이터베이스 복원
log_message "🔄 데이터베이스 복원 중..."
gunzip -c "$BACKUP_FILE" | mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME"

if [ $? -eq 0 ]; then
    log_message "✅ 데이터베이스 복원 완료"
    
    # 복원 후 테이블 수 확인
    TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p -e "USE $DB_NAME; SHOW TABLES;" | wc -l)
    log_message "📊 복원된 테이블 수: $((TABLE_COUNT - 1))개"
    
    # 안전 백업 파일 제거 (복원 성공 시)
    rm -f "$SAFETY_BACKUP"
    log_message "🗑️ 안전 백업 파일 제거됨"
    
else
    log_error "❌ 데이터베이스 복원 실패"
    log_warning "🛡️ 안전 백업 파일이 보존되었습니다: $SAFETY_BACKUP"
    exit 1
fi

log_message "🎉 데이터베이스 복원 완료!"
