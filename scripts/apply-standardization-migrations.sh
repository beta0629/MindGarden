#!/bin/bash

##############################################################################
# CoreSolution 표준화 마이그레이션 적용 스크립트
# 작성일: 2025-12-02
# 목적: AI 모니터링, 스케줄러, 보안 표준화 관련 DB 마이그레이션 적용
##############################################################################

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경 변수 로드
ENV_FILE="config/environments/development/dev.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo -e "${GREEN}✅ dev.env 파일 로드 완료${NC}"
else
    echo -e "${RED}❌ dev.env 파일을 찾을 수 없습니다: ${ENV_FILE}${NC}"
    exit 1
fi

# 데이터베이스 연결 정보
DB_HOST="${DB_HOST:-beta0629.cafe24.com}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USER="${DB_USER:-mindgarden_dev}"
DB_PASS="${DB_PASS:-MindGardenDev2025!@#}"

echo ""
echo "=========================================="
echo "CoreSolution 표준화 마이그레이션 적용"
echo "=========================================="
echo ""
echo "데이터베이스: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""

# MySQL 연결 테스트
echo -e "${BLUE}[INFO]${NC} 데이터베이스 연결 테스트 중..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 데이터베이스 연결 성공${NC}"
else
    echo -e "${RED}❌ 데이터베이스 연결 실패${NC}"
    exit 1
fi

# 마이그레이션 파일 목록
MIGRATIONS=(
    "database/migrations/V20251202_001__create_scheduler_execution_tables.sql"
    "database/migrations/V20251202_002__create_security_audit_tables.sql"
    "database/migrations/V20251202_003__create_ai_monitoring_tables.sql"
)

# 마이그레이션 적용 함수
apply_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo ""
    echo -e "${BLUE}[INFO]${NC} 마이그레이션 적용 중: ${migration_name}"
    
    # 파일 존재 확인
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}❌ 파일을 찾을 수 없습니다: ${migration_file}${NC}"
        return 1
    fi
    
    # 이미 적용되었는지 확인
    local table_check=""
    if [[ "$migration_name" == *"scheduler_execution"* ]]; then
        table_check="scheduler_execution_log"
    elif [[ "$migration_name" == *"security_audit"* ]]; then
        table_check="security_audit_log"
    elif [[ "$migration_name" == *"ai_monitoring"* ]]; then
        table_check="system_metric"
    fi
    
    if [ -n "$table_check" ]; then
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
            -e "SHOW TABLES LIKE '$table_check';" 2>/dev/null | grep -q "$table_check"; then
            echo -e "${YELLOW}⚠️  테이블이 이미 존재합니다: ${table_check} (스킵)${NC}"
            return 0
        fi
    fi
    
    # 마이그레이션 적용
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$migration_file" 2>&1; then
        echo -e "${GREEN}✅ 마이그레이션 적용 완료: ${migration_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ 마이그레이션 적용 실패: ${migration_name}${NC}"
        return 1
    fi
}

# 백업 생성
echo ""
echo -e "${BLUE}[INFO]${NC} 데이터베이스 백업 생성 중..."
BACKUP_FILE="backup/db-backup-before-standardization-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backup

if mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
    --single-transaction --routines --triggers > "$BACKUP_FILE" 2>&1; then
    echo -e "${GREEN}✅ 백업 생성 완료: ${BACKUP_FILE}${NC}"
else
    echo -e "${YELLOW}⚠️  백업 생성 실패 (계속 진행)${NC}"
fi

# 모든 마이그레이션 적용
SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    if apply_migration "$migration"; then
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
            -e "SHOW TABLES;" 2>/dev/null | grep -q "scheduler_execution_log\|security_audit_log\|system_metric"; then
            ((SUCCESS_COUNT++))
        else
            ((SKIP_COUNT++))
        fi
    else
        ((FAIL_COUNT++))
    fi
done

# 결과 확인
echo ""
echo "=========================================="
echo "마이그레이션 적용 결과"
echo "=========================================="
echo ""
echo "총 마이그레이션: ${#MIGRATIONS[@]}"
echo -e "${GREEN}성공: ${SUCCESS_COUNT}${NC}"
echo -e "${YELLOW}스킵: ${SKIP_COUNT}${NC}"
echo -e "${RED}실패: ${FAIL_COUNT}${NC}"
echo ""

# 테이블 생성 확인
echo -e "${BLUE}[INFO]${NC} 생성된 테이블 확인 중..."
echo ""

EXPECTED_TABLES=(
    "scheduler_execution_log"
    "scheduler_execution_summary"
    "security_audit_log"
    "system_metric"
    "ai_anomaly_detection"
    "security_threat_detection"
)

for table in "${EXPECTED_TABLES[@]}"; do
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -q "$table"; then
        
        # 레코드 수 확인
        COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
            -se "SELECT COUNT(*) FROM $table;" 2>/dev/null)
        
        echo -e "${GREEN}✅ ${table}${NC} (레코드: ${COUNT})"
    else
        echo -e "${RED}❌ ${table} (존재하지 않음)${NC}"
    fi
done

echo ""
echo "=========================================="

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 마이그레이션이 성공적으로 적용되었습니다!${NC}"
    exit 0
else
    echo -e "${RED}❌ 일부 마이그레이션 적용에 실패했습니다.${NC}"
    exit 1
fi

