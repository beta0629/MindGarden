#!/bin/bash
# 실패한 V31 Flyway 마이그레이션 복구 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 실패한 V31 Flyway 마이그레이션 복구 시작...${NC}"
echo ""

# 프로젝트 루트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# 환경 변수 로드 시도
if [ -f ".env.local" ]; then
    source scripts/load-env.sh 2>/dev/null || true
fi

# DB 정보 설정
DB_NAME="${DB_NAME:-${SPRING_DATASOURCE_DATABASE:-core_solution}}"
DB_USER="${DB_USERNAME:-${SPRING_DATASOURCE_USERNAME:-root}}"
DB_PASS="${DB_PASSWORD:-${SPRING_DATASOURCE_PASSWORD}}"
DB_HOST="${DB_HOST:-${SPRING_DATASOURCE_HOST:-localhost}}"
DB_PORT="${DB_PORT:-${SPRING_DATASOURCE_PORT:-3306}}"

if [ -z "$DB_PASS" ]; then
    echo -e "${RED}❌ DB 비밀번호를 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}💡 다음 중 하나를 시도하세요:${NC}"
    echo "   1. .env.local 파일에 DB_PASSWORD 설정"
    echo "   2. 환경 변수로 export: export DB_PASSWORD='your-password'"
    echo "   3. MySQL에 직접 접속하여 수동 삭제:"
    echo "      mysql -u root -p core_solution"
    echo "      DELETE FROM flyway_schema_history WHERE version = '31' AND success = 0;"
    exit 1
fi

echo -e "${BLUE}📋 DB 정보:${NC}"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# 현재 V31 마이그레이션 상태 확인
echo -e "${YELLOW}📊 현재 V31 마이그레이션 상태 확인...${NC}"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
    SELECT version, description, type, installed_on, success, execution_time
    FROM flyway_schema_history 
    WHERE version = '31'
    ORDER BY installed_rank DESC
    LIMIT 5;
" 2>/dev/null || echo -e "${YELLOW}⚠️  쿼리 실행 실패 (계속 진행)${NC}"

echo ""
echo -e "${YELLOW}🔧 실패한 V31 마이그레이션 레코드 삭제 중...${NC}"

# 실패한 V31 마이그레이션 레코드 삭제
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" << SQL
DELETE FROM flyway_schema_history 
WHERE version = '31' AND success = 0;

SELECT 
    CASE 
        WHEN ROW_COUNT() > 0 THEN CONCAT('✅ ', ROW_COUNT(), '개의 실패한 V31 마이그레이션 레코드 삭제 완료')
        ELSE 'ℹ️  삭제할 실패한 V31 마이그레이션 레코드가 없습니다'
    END AS result;
SQL

echo ""
echo -e "${GREEN}✅ 실패한 V31 Flyway 마이그레이션 복구 완료!${NC}"
echo ""
echo -e "${BLUE}📝 다음 단계:${NC}"
echo -e "   1. 서버를 다시 실행하세요: ./scripts/start-backend.sh local"
echo -e "   2. V31 마이그레이션이 정상적으로 실행될 것입니다"
echo ""

