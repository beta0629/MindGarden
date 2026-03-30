#!/bin/bash

# ============================================
# 전체 자동화 테스트 실행 스크립트
# API 테스트 + E2E 테스트를 한 번에 실행
# 화면 입력 없이 모든 테스트를 자동으로 실행합니다
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/.."

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT_DIR="test-reports/automated-all/${TIMESTAMP}"
mkdir -p "${TEST_REPORT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🤖 전체 자동화 테스트 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 테스트 계정 정보
export TEST_USERNAME="${TEST_USERNAME:-superadmin@mindgarden.com}"
export TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

API_PASSED=0
API_FAILED=0
E2E_PASSED=0
E2E_FAILED=0

# ============================================
# 1. API 테스트 실행
# ============================================
echo -e "${YELLOW}📡 1단계: API 테스트 실행${NC}"
echo ""

if ./scripts/run-automated-api-tests.sh 2>&1 | tee "${TEST_REPORT_DIR}/api-tests.log"; then
    API_PASSED=1
    echo -e "${GREEN}✅ API 테스트 완료${NC}"
else
    API_FAILED=1
    echo -e "${RED}❌ API 테스트 실패${NC}"
fi
echo ""

# ============================================
# 2. E2E 테스트 실행
# ============================================
echo -e "${YELLOW}🎭 2단계: E2E 테스트 실행${NC}"
echo ""

if ./scripts/run-e2e-tests.sh 2>&1 | tee "${TEST_REPORT_DIR}/e2e-tests.log"; then
    E2E_PASSED=1
    echo -e "${GREEN}✅ E2E 테스트 완료${NC}"
else
    E2E_FAILED=1
    echo -e "${RED}❌ E2E 테스트 실패${NC}"
fi
echo ""

# ============================================
# 3. 결과 리포트 생성
# ============================================
echo -e "${YELLOW}📊 결과 리포트 생성 중...${NC}"

SUMMARY_FILE="${TEST_REPORT_DIR}/test-summary.md"

cat > "${SUMMARY_FILE}" << EOF
# 전체 자동화 테스트 결과 리포트

**실행 시간**: $(date)
**타임스탬프**: ${TIMESTAMP}
**테스트 계정**: ${TEST_USERNAME}

## 테스트 결과 요약

### API 테스트
- 상태: $([ $API_PASSED -eq 1 ] && echo "✅ 통과" || echo "❌ 실패")
- 로그: \`${TEST_REPORT_DIR}/api-tests.log\`

### E2E 테스트
- 상태: $([ $E2E_PASSED -eq 1 ] && echo "✅ 통과" || echo "❌ 실패")
- 로그: \`${TEST_REPORT_DIR}/e2e-tests.log\`

## 전체 결과

$([ $API_PASSED -eq 1 ] && [ $E2E_PASSED -eq 1 ] && echo "✅ **모든 테스트 통과!**" || echo "❌ **일부 테스트 실패**")

## 상세 리포트

- API 테스트: \`test-reports/automated-api/\` 디렉토리 확인
- E2E 테스트: \`e2e-tests/test-reports/\` 디렉토리 확인

## 다음 단계

1. 실패한 테스트 확인 및 수정
2. 재실행: \`./scripts/run-all-automated-tests.sh\`

## 사용법

\`\`\`bash
# 기본 실행
./scripts/run-all-automated-tests.sh

# 다른 계정으로 실행
TEST_USERNAME=admin@example.com TEST_PASSWORD=password ./scripts/run-all-automated-tests.sh

# API 테스트만 실행
./scripts/run-automated-api-tests.sh

# E2E 테스트만 실행
./scripts/run-e2e-tests.sh
\`\`\`

EOF

echo -e "${GREEN}✅ 리포트 생성 완료: ${SUMMARY_FILE}${NC}"
echo ""

# ============================================
# 최종 결과
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 최종 결과${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $API_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ API 테스트: 통과${NC}"
else
    echo -e "${RED}❌ API 테스트: 실패${NC}"
fi

if [ $E2E_PASSED -eq 1 ]; then
    echo -e "${GREEN}✅ E2E 테스트: 통과${NC}"
else
    echo -e "${RED}❌ E2E 테스트: 실패${NC}"
fi

echo ""
echo -e "${BLUE}📊 리포트: ${SUMMARY_FILE}${NC}"
echo ""

if [ $API_PASSED -eq 1 ] && [ $E2E_PASSED -eq 1 ]; then
    echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  일부 테스트 실패${NC}"
    exit 1
fi

