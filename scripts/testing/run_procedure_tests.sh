#!/bin/bash

# 프로시저 표준화 테스트 실행 스크립트
# 개발 서버에서 실행

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# DB 연결 정보
DB_HOST="${DB_HOST:-beta0629.cafe24.com}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_PASS="${DB_PASSWORD:-MindGardenDev2025!@#}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log_section "프로시저 표준화 테스트 시작"

# MySQL 접속 테스트
log_info "MySQL 접속 테스트: $DB_HOST:$DB_PORT/$DB_NAME"
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT 1" &>/dev/null; then
    log_info "MySQL 접속 성공"
else
    log_error "MySQL 접속 실패"
    exit 1
fi

# 테스트 1: 종합 테스트 스크립트 실행
log_section "테스트 1: 프로시저 종합 검증"
log_info "test_procedures_comprehensive.sql 실행 중..."

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
    --default-character-set=utf8mb4 \
    < "$SCRIPT_DIR/test_procedures_comprehensive.sql" || {
    log_error "종합 테스트 스크립트 실행 실패"
    exit 1
}

log_info "종합 테스트 스크립트 실행 완료"

# 테스트 2: 수동 프로시저 검증
log_section "테스트 2: 수동 프로시저 검증"
log_info "manual_procedure_check.sql 실행 중..."

if [ -f "$PROJECT_ROOT/database/schema/manual_procedure_check.sql" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        --default-character-set=utf8mb4 \
        < "$PROJECT_ROOT/database/schema/manual_procedure_check.sql" || {
        log_warn "수동 프로시저 검증 스크립트 실행 실패 (무시 가능)"
    }
    log_info "수동 프로시저 검증 완료"
else
    log_warn "manual_procedure_check.sql 파일을 찾을 수 없습니다"
fi

log_section "프로시저 테스트 완료"
log_info "결과는 위의 출력을 확인하세요"

