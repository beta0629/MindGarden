#!/bin/bash
# 실패한 V25 Flyway 마이그레이션 복구 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 실패한 V25 Flyway 마이그레이션 복구 시작...${NC}"
echo ""

# 환경 변수 로드 (.env.local 파일이 있으면)
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📋 환경 변수 로드 중...${NC}"
    set -a
    source .env.local 2>/dev/null
    set +a
    echo -e "${GREEN}✅ 환경 변수 로드 완료${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 환경 변수를 수동으로 설정하세요.${NC}"
fi

# 데이터베이스 연결 정보
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USERNAME="${DB_USERNAME:-mindgarden_dev}"
DB_PASSWORD="${DB_PASSWORD}"

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ DB_PASSWORD 환경 변수가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}   .env.local 파일에 DB_PASSWORD를 설정하거나 환경 변수로 export하세요.${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 실패한 V25 마이그레이션 레코드 삭제 중...${NC}"

# 실패한 V25 마이그레이션 레코드 삭제
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'SQL'
    -- 실패한 V25 마이그레이션 레코드 삭제
    DELETE FROM flyway_schema_history 
    WHERE version = '25' AND success = 0;
    
    SELECT 
        CASE 
            WHEN ROW_COUNT() > 0 THEN CONCAT('✅ ', ROW_COUNT(), '개의 실패한 V25 마이그레이션 레코드 삭제 완료')
            ELSE 'ℹ️  삭제할 실패한 V25 마이그레이션 레코드가 없습니다'
        END AS result;
SQL

echo ""
echo -e "${GREEN}✅ 실패한 V25 Flyway 마이그레이션 복구 완료!${NC}"
echo ""
echo -e "${BLUE}📝 다음 단계:${NC}"
echo -e "   1. 서버를 다시 실행하세요: ./scripts/start-backend.sh local"
echo -e "   2. V25 마이그레이션이 정상적으로 실행될 것입니다"
echo ""

