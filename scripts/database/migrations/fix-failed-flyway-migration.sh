#!/bin/bash
# 실패한 Flyway 마이그레이션 복구 스크립트
# 로컬 개발 환경용

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 실패한 Flyway 마이그레이션 복구 시작...${NC}"
echo ""

# 환경 변수 로드 (.env.local 파일이 있으면)
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📋 환경 변수 로드 중...${NC}"
    set -a  # 자동으로 export
    source .env.local 2>/dev/null
    set +a  # export 해제
    echo -e "${GREEN}✅ 환경 변수 로드 완료${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 환경 변수를 수동으로 설정하세요.${NC}"
fi

# 데이터베이스 연결 정보
DB_HOST="${DB_HOST:-beta0629.cafe24.com}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USERNAME="${DB_USERNAME:-mindgarden_dev}"
DB_PASSWORD="${DB_PASSWORD}"

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ DB_PASSWORD 환경 변수가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}   .env.local 파일에 DB_PASSWORD를 설정하거나 환경 변수로 export하세요.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 데이터베이스 정보:${NC}"
echo -e "   호스트: ${DB_HOST}"
echo -e "   포트: ${DB_PORT}"
echo -e "   데이터베이스: ${DB_NAME}"
echo -e "   사용자: ${DB_USERNAME}"
echo ""

# 현재 Flyway 마이그레이션 상태 확인
echo -e "${YELLOW}📊 현재 Flyway 마이그레이션 상태 확인...${NC}"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "
    SELECT version, description, type, installed_on, success, execution_time
    FROM flyway_schema_history 
    WHERE version = '20'
    ORDER BY installed_rank DESC
    LIMIT 5;
" 2>/dev/null || echo -e "${YELLOW}⚠️  쿼리 실행 실패 (계속 진행)${NC}"

echo ""
echo -e "${YELLOW}🔧 실패한 V20 마이그레이션 레코드 삭제 중...${NC}"

# 실패한 V20 마이그레이션 레코드 삭제
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'SQL'
    -- 실패한 V20 마이그레이션 레코드 삭제
    DELETE FROM flyway_schema_history 
    WHERE version = '20' AND success = 0;
    
    SELECT 
        CASE 
            WHEN ROW_COUNT() > 0 THEN CONCAT('✅ ', ROW_COUNT(), '개의 실패한 V20 마이그레이션 레코드 삭제 완료')
            ELSE 'ℹ️  삭제할 실패한 V20 마이그레이션 레코드가 없습니다'
        END AS result;
SQL

echo ""
echo -e "${GREEN}✅ 실패한 Flyway 마이그레이션 복구 완료!${NC}"
echo ""
echo -e "${BLUE}📝 다음 단계:${NC}"
echo -e "   1. 서버를 다시 실행하세요: ./scripts/start-backend.sh local"
echo -e "   2. V20 마이그레이션이 정상적으로 실행될 것입니다"
echo ""

