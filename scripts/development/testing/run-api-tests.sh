#!/bin/bash

# ============================================
# API 자동 테스트 스크립트
# 서버가 실행 중일 때 API 엔드포인트를 자동으로 테스트
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="${API_BASE_URL:-http://localhost:8080}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT_DIR="test-reports/api-tests/${TIMESTAMP}"
mkdir -p "${TEST_REPORT_DIR}"

PASSED=0
FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🌐 API 자동 테스트 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo ""

# 서버 상태 확인
echo -e "${YELLOW}🔍 서버 상태 확인 중...${NC}"
if ! curl -s -f "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ 서버가 실행 중이 아닙니다!${NC}"
    echo -e "${YELLOW}서버를 먼저 실행하세요: ./scripts/start-backend.sh local${NC}"
    exit 1
fi

HEALTH_RESPONSE=$(curl -s "${BASE_URL}/actuator/health")
echo -e "${GREEN}✅ 서버 실행 중: ${HEALTH_RESPONSE}${NC}"
echo ""

# 테스트 함수
test_api() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    echo -e "${BLUE}  → ${description}${NC}"
    echo -e "     ${method} ${endpoint}"
    
    if [ "$method" == "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    elif [ "$method" == "POST" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "${data}" \
            "${BASE_URL}${endpoint}")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # 결과 저장
    echo "$BODY" | jq . > "${TEST_REPORT_DIR}/${description// /_}.json" 2>/dev/null || echo "$BODY" > "${TEST_REPORT_DIR}/${description// /_}.txt"
    
    if [ "$HTTP_CODE" == "$expected_status" ]; then
        echo -e "     ${GREEN}✅ 통과 (HTTP ${HTTP_CODE})${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "     ${RED}❌ 실패 (예상: ${expected_status}, 실제: ${HTTP_CODE})${NC}"
        ((FAILED++))
        return 1
    fi
}

# ============================================
# 1. Health Check API
# ============================================
echo -e "${YELLOW}📋 1. Health Check API${NC}"
test_api "GET" "/actuator/health" "200" "Health Check"
echo ""

# ============================================
# 2. ERD API 테스트
# ============================================
echo -e "${YELLOW}📋 2. ERD API 테스트${NC}"

# 테넌트 ID (실제 테넌트 ID로 변경 필요)
TENANT_ID="test-tenant-$(date +%s)"

# ERD 목록 조회 (인증 없이 테스트 - 실제로는 인증 필요)
test_api "GET" "/api/v1/tenants/${TENANT_ID}/erd" "200" "ERD 목록 조회" || true

# ERD 상세 조회 (ERD ID가 필요한 경우)
# test_api "GET" "/api/v1/tenants/${TENANT_ID}/erd/{diagramId}" "200" "ERD 상세 조회" || true

echo ""

# ============================================
# 3. 공통코드 API 테스트 (새로운 표준 API)
# ============================================
echo -e "${YELLOW}📋 3. 공통코드 API 테스트${NC}"
# 코어 코드 조회 (전역 코드)
test_api "GET" "/api/v1/common-codes?codeGroup=USER_ROLE" "200" "코어 공통코드 조회 (USER_ROLE)" || true
test_api "GET" "/api/v1/common-codes?codeGroup=USER_STATUS" "200" "코어 공통코드 조회 (USER_STATUS)" || true

# 테넌트 코드 조회 (테넌트별 독립 코드) - 인증 필요
# test_api "GET" "/api/v1/common-codes/tenant?codeGroup=CONSULTATION_PACKAGE" "200" "테넌트 공통코드 조회" || true
echo ""

# ============================================
# 4. Swagger UI 확인
# ============================================
echo -e "${YELLOW}📋 4. Swagger UI 확인${NC}"
if curl -s -f "${BASE_URL}/swagger-ui.html" > /dev/null 2>&1; then
    echo -e "     ${GREEN}✅ Swagger UI 접근 가능${NC}"
    ((PASSED++))
else
    echo -e "     ${YELLOW}⚠️  Swagger UI 접근 불가 (정상일 수 있음)${NC}"
fi
echo ""

# ============================================
# 5. 결과 리포트 생성
# ============================================
echo -e "${YELLOW}📊 테스트 결과 리포트 생성 중...${NC}"

SUMMARY_FILE="${TEST_REPORT_DIR}/api-test-summary.md"

cat > "${SUMMARY_FILE}" << EOF
# API 테스트 결과 리포트

**실행 시간**: $(date)
**Base URL**: ${BASE_URL}
**타임스탬프**: ${TIMESTAMP}

## 테스트 결과 요약

- ✅ 통과: ${PASSED}개
- ❌ 실패: ${FAILED}개
- 📊 총 테스트: $((PASSED + FAILED))개

## 실행된 테스트

1. Health Check API
2. ERD 목록 조회 API
3. 공통코드 API
4. Swagger UI 접근 확인

## 상세 응답

각 API의 응답은 \`${TEST_REPORT_DIR}/\` 디렉토리에 저장되었습니다.

## 다음 단계

1. 실패한 API 확인 및 수정
2. 인증이 필요한 API는 토큰 추가 필요
3. 재실행: \`./scripts/run-api-tests.sh\`

EOF

echo -e "${GREEN}✅ 리포트 생성 완료: ${SUMMARY_FILE}${NC}"
echo ""

# ============================================
# 최종 결과
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 통과: ${PASSED}개${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ 실패: ${FAILED}개${NC}"
    echo -e "${YELLOW}📊 리포트: ${SUMMARY_FILE}${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 모든 API 테스트 통과!${NC}"
    echo -e "${GREEN}📊 리포트: ${SUMMARY_FILE}${NC}"
    exit 0
fi

