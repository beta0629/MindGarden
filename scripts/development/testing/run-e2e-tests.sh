#!/bin/bash

# ============================================
# E2E 테스트 자동 실행 스크립트
# Playwright를 사용하여 브라우저 자동화 테스트 실행
# 화면 입력 없이 자동으로 실행됩니다
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/.."

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🎭 E2E 테스트 자동 실행${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Playwright 설치 확인
if [ ! -d "e2e-tests/node_modules" ]; then
    echo -e "${YELLOW}📦 Playwright 설치 중...${NC}"
    cd e2e-tests
    npm install
    npx playwright install --with-deps chromium
    cd ..
    echo -e "${GREEN}✅ Playwright 설치 완료${NC}"
    echo ""
fi

# 서버 상태 확인
BASE_URL="${BASE_URL:-http://localhost:3000}"
echo -e "${YELLOW}🔍 서버 상태 확인 중... (${BASE_URL})${NC}"
if ! curl -s -f "${BASE_URL}" > /dev/null 2>&1; then
    echo -e "${RED}❌ 프론트엔드 서버가 실행 중이 아닙니다!${NC}"
    echo -e "${YELLOW}서버를 먼저 실행하세요: ./scripts/start-all.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 서버 실행 중${NC}"
echo ""

# 테스트 계정 정보
export TEST_USERNAME="${TEST_USERNAME:-superadmin@mindgarden.com}"
export TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

echo -e "${BLUE}테스트 계정: ${TEST_USERNAME}${NC}"
echo ""

# E2E 테스트 실행
cd e2e-tests

echo -e "${YELLOW}🧪 E2E 테스트 실행 중...${NC}"
echo ""

# 테스트 실행
if npm test; then
    echo ""
    echo -e "${GREEN}✅ 모든 E2E 테스트 통과!${NC}"
    echo ""
    echo -e "${BLUE}📊 리포트 확인:${NC}"
    echo -e "${GREEN}   npm run test:report${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ 일부 E2E 테스트 실패${NC}"
    echo ""
    echo -e "${BLUE}📊 리포트 확인:${NC}"
    echo -e "${GREEN}   npm run test:report${NC}"
    echo ""
    exit 1
fi

